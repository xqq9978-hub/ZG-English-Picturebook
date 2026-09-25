#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [command, projectArg, ...flags] = process.argv.slice(2);
const CONFIRMATION_FLAG = "--confirm";
const sceneFlagIndex = flags.indexOf("--scene");
const requestedSceneId = sceneFlagIndex >= 0 ? flags[sceneFlagIndex + 1] : null;

if (!command || !projectArg || !["doctor", "anchor", "images", "video", "status"].includes(command)) {
  throw new Error("Usage: node byteplus-ark.mjs <doctor|anchor|images|video|status> <project-directory> [--scene 01] [--confirm]");
}
if (command === "video" && !requestedSceneId) throw new Error("Video generation requires --scene <scene-id>; submit and review one scene at a time.");
if (sceneFlagIndex >= 0 && !requestedSceneId) throw new Error("--scene requires a scene ID.");

const projectDir = path.resolve(projectArg);
const storyboardPath = path.join(projectDir, "storyboard.json");
if (!fs.existsSync(storyboardPath)) throw new Error(`Missing storyboard.json in ${projectDir}`);
loadEnv(path.join(projectDir, ".env"));
loadEnv(path.join(process.cwd(), ".env"));

const config = {
  arkKey: process.env.ARK_API_KEY || "",
  arkBaseUrl: trimSlash(process.env.ARK_BASE_URL || "https://ark.ap-southeast.bytepluses.com/api/v3"),
  imageModel: process.env.ARK_IMAGE_MODEL || "seedream-5-0-lite-260128",
  lasKey: process.env.LAS_API_KEY || "",
  lasBaseUrl: trimSlash(process.env.LAS_BASE_URL || "https://operator.las.ap-southeast-1.bytepluses.com/api/v1"),
  videoModel: process.env.LAS_VIDEO_MODEL || "dreamina-seedance-2-0-fast-260128",
};
const storyboard = JSON.parse(fs.readFileSync(storyboardPath, "utf8"));
validateStoryboard();
const statePath = path.join(projectDir, "byteplus-ark-state.json");
const state = loadState();

if (command === "doctor") {
  console.log(JSON.stringify({
    ready: { image: Boolean(config.arkKey), video: Boolean(config.lasKey) },
    models: { image: config.imageModel, video: config.videoModel },
    requestsMade: 0,
    note: "doctor performs no provider request and does not verify keys remotely.",
  }, null, 2));
} else if (command === "anchor") {
  requireConfirm("one Seedream anchor-image request");
  requireKey("arkKey", "ARK_API_KEY is required for anchor generation.");
  const result = await generateImage(anchorPrompt());
  const destination = path.join(projectDir, "assets", "anchors", "character-anchor.png");
  await download(result.url, destination);
  state.anchor = { url: result.url, path: relative(destination), createdAt: new Date().toISOString() };
  saveState();
  console.log(JSON.stringify({ submitted: "anchor", saved: relative(destination), reviewRequired: true }, null, 2));
} else if (command === "images") {
  requireConfirm("one Seedream image request per missing scene");
  requireKey("arkKey", "ARK_API_KEY is required for scene-image generation.");
  if (!state.anchor?.url) throw new Error("Generate and approve an anchor first. The adapter needs its temporary provider URL for scene consistency.");
  if (!flags.includes("--anchor-approved")) throw new Error("Review the anchor, then rerun with --anchor-approved before generating scene images.");
  const missing = storyboard.scenes.filter((scene) => !fs.existsSync(path.join(projectDir, "assets", "images", `${scene.id}.png`)));
  if (!missing.length) {
    console.log(JSON.stringify({ submitted: 0, note: "All scene images already exist." }, null, 2));
  } else {
    for (const scene of missing) {
      const result = await generateImage(scene.imagePrompt, state.anchor.url);
      const destination = path.join(projectDir, "assets", "images", `${scene.id}.png`);
      await download(result.url, destination);
      state.images[scene.id] = { url: result.url, path: relative(destination), createdAt: new Date().toISOString() };
      saveState();
      console.log(`Saved scene image ${scene.id}: ${relative(destination)}`);
    }
    console.log(JSON.stringify({ submitted: missing.length, nextAction: "Review scene images before submitting video." }, null, 2));
  }
} else if (command === "video") {
  requireConfirm(`one Seedance video request for scene ${requestedSceneId}`);
  requireKey("lasKey", "LAS_API_KEY is required for Seedance video generation.");
  const scene = storyboard.scenes.find((item) => item.id === requestedSceneId);
  if (!scene) throw new Error(`Scene ${requestedSceneId} does not exist in storyboard.json.`);
  const image = state.images[scene.id];
  if (!image?.url || !fs.existsSync(path.join(projectDir, image.path))) {
    throw new Error(`Scene ${scene.id} needs an adapter-generated image before video submission.`);
  }
  if (!flags.includes("--scene-approved")) throw new Error(`Review scene ${scene.id}, then rerun with --scene-approved before submitting its video.`);
  if (state.videos[scene.id]?.status && !["failed", "cancelled", "expired"].includes(state.videos[scene.id].status)) {
    throw new Error(`Scene ${scene.id} already has task ${state.videos[scene.id].taskId}; use status before creating another task.`);
  }
  const task = await submitVideo(scene, image.url);
  state.videos[scene.id] = { taskId: task.id, status: "queued", submittedAt: new Date().toISOString() };
  saveState();
  console.log(JSON.stringify({ submitted: scene.id, taskId: task.id, nextAction: "Run status until the clip is downloaded, then review it before the next scene." }, null, 2));
} else if (command === "status") {
  requireKey("lasKey", "LAS_API_KEY is required to query Seedance video tasks.");
  const updates = [];
  for (const [sceneId, video] of Object.entries(state.videos)) {
    if (!video.taskId || ["succeeded", "failed", "cancelled", "expired"].includes(video.status)) continue;
    const task = await getVideoTask(video.taskId);
    state.videos[sceneId] = { ...video, status: task.status, updatedAt: new Date().toISOString(), error: task.error || null };
    if (task.status === "succeeded" && task.content?.video_url) {
      const destination = path.join(projectDir, "assets", "clips", `${sceneId}.mp4`);
      await download(task.content.video_url, destination);
      state.videos[sceneId].path = relative(destination);
    }
    updates.push({ sceneId, taskId: video.taskId, status: task.status, path: state.videos[sceneId].path || null });
  }
  saveState();
  console.log(JSON.stringify({ updates, nextAction: updates.some((item) => item.status === "succeeded") ? "Review completed clips before submitting another scene." : "Wait briefly, then run status again." }, null, 2));
}

function validateStoryboard() {
  const validator = path.join(path.dirname(import.meta.url.replace("file://", "")), "validate-story.mjs");
  const result = spawnSync(process.execPath, [validator, storyboardPath], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Storyboard validation failed.\n${result.stdout || result.stderr}`);
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function loadState() {
  if (!fs.existsSync(statePath)) return { schemaVersion: 1, provider: "byteplus-ark", anchor: null, images: {}, videos: {} };
  const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
  return { schemaVersion: 1, provider: "byteplus-ark", anchor: parsed.anchor || null, images: parsed.images || {}, videos: parsed.videos || {} };
}

function saveState() {
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function requireConfirm(description) {
  if (!flags.includes(CONFIRMATION_FLAG)) throw new Error(`Refusing to submit ${description} without --confirm. This may consume paid provider credits.`);
}

function requireKey(name, message) {
  if (!config[name]) throw new Error(message);
}

function anchorPrompt() {
  return `${storyboard.stylePrefix}\n\nVertical 3:4 character anchor image. ${storyboard.visualBible.anchorDescription} Show all recurring characters full body, standing side by side, in a clean calm scene. Make colors, proportions, silhouettes, and accessories clear for reuse in every later scene.`;
}

async function generateImage(prompt, referenceUrl = null) {
  const body = { model: config.imageModel, prompt, size: "2K", output_format: "png", response_format: "url", watermark: false };
  if (referenceUrl) body.image = referenceUrl;
  const response = await providerFetch(`${config.arkBaseUrl}/images/generations`, config.arkKey, body);
  const url = response.data?.[0]?.url;
  if (!url) throw new Error("Ark image response did not include data[0].url.");
  return { url };
}

async function submitVideo(scene, imageUrl) {
  const body = {
    model: config.videoModel,
    content: [
      { type: "text", text: scene.motionPrompt },
      { type: "image_url", image_url: { url: imageUrl }, role: "reference_image" },
    ],
    watermark: false,
  };
  return providerFetch(`${config.lasBaseUrl}/contents/generations/tasks`, config.lasKey, body);
}

async function getVideoTask(taskId) {
  const response = await fetch(`${config.lasBaseUrl}/contents/generations/tasks/${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${config.lasKey}`, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`LAS task query failed (${response.status}): ${await safeErrorText(response)}`);
  return response.json();
}

async function providerFetch(url, key, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Provider request failed (${response.status}): ${await safeErrorText(response)}`);
  return response.json();
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download generated asset (${response.status}).`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

async function safeErrorText(response) {
  const text = await response.text();
  return text.slice(0, 600);
}

function trimSlash(value) { return value.replace(/\/+$/u, ""); }
function relative(file) { return path.relative(projectDir, file); }
