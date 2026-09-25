#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , input, ...args] = process.argv;
const writeReport = args.includes("--write-report");
if (!input) throw new Error("Usage: node validate-story.mjs <storyboard.json> [--write-report]");
const sourcePath = path.resolve(input);
const story = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const errors = [];
const warnings = [];
const requiredKeywords = ["color", "size", "taste", "verb", "place"];
const scenes = Array.isArray(story.scenes) ? story.scenes : [];
const expectedScenes = Number(story.sceneCount || 6);
const seenIds = new Set();

if (story.schemaVersion !== 1) errors.push("schemaVersion must be 1");
if (!String(story.title || "").trim()) errors.push("title is required");
if (!String(story.profile || "").trim()) errors.push("profile is required");
if (!String(story.stylePrefix || "").trim()) errors.push("stylePrefix is required");
if (!story.visualBible || !String(story.visualBible.anchorDescription || "").trim()) errors.push("visualBible.anchorDescription is required");
if (scenes.length !== expectedScenes) errors.push(`expected ${expectedScenes} scenes, found ${scenes.length}`);

for (const [index, scene] of scenes.entries()) {
  const tag = `scene ${index + 1}`;
  if (!String(scene.id || "").trim()) errors.push(`${tag}: id is required`);
  else if (seenIds.has(scene.id)) errors.push(`${tag}: duplicate id ${scene.id}`);
  else seenIds.add(scene.id);
  if (!String(scene.title || "").trim()) errors.push(`${tag}: title is required`);
  const english = String(scene.english || "").trim();
  const wordCount = english.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length || 0;
  if (!english) errors.push(`${tag}: english is required`);
  else if (wordCount < 4 || wordCount > 12) warnings.push(`${tag}: English line has ${wordCount} words; the default target is 4–12`);
  if (!String(scene.chinese || "").trim()) errors.push(`${tag}: chinese translation is required`);
  if (!scene.keywords || typeof scene.keywords !== "object") errors.push(`${tag}: keywords are required`);
  else for (const key of requiredKeywords) if (!String(scene.keywords[key] || "").trim()) errors.push(`${tag}: keywords.${key} is required`);
  const duration = Number(scene.durationSeconds);
  if (!Number.isFinite(duration) || duration < 4 || duration > 15) errors.push(`${tag}: durationSeconds must be between 4 and 15`);
  if (!String(scene.imagePrompt || "").trim()) errors.push(`${tag}: imagePrompt is required`);
  if (!String(scene.motionPrompt || "").trim()) errors.push(`${tag}: motionPrompt is required`);
}

const totalDuration = scenes.reduce((total, scene) => total + (Number(scene.durationSeconds) || 0), 0);
const report = { valid: errors.length === 0, source: sourcePath, title: story.title || "", sceneCount: scenes.length, totalDurationSeconds: totalDuration, errors, warnings };
console.log(JSON.stringify(report, null, 2));
if (writeReport) {
  const target = path.join(path.dirname(sourcePath), "qa-report.json");
  fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${target}`);
}
if (errors.length) process.exitCode = 1;
