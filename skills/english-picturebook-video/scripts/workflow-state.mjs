#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , command = "status", project] = process.argv;
if (command !== "status" || !project) throw new Error("Usage: node workflow-state.mjs status <project-directory>");
const projectDir = path.resolve(project);
const storyboardPath = path.join(projectDir, "storyboard.json");
const storyboard = fs.existsSync(storyboardPath) ? JSON.parse(fs.readFileSync(storyboardPath, "utf8")) : null;
const scenes = storyboard?.scenes || [];
const imageDir = path.join(projectDir, "assets", "images");
const clipDir = path.join(projectDir, "assets", "clips");
const present = (dir, extension) => scenes.filter((scene) => fs.existsSync(path.join(dir, `${scene.id}.${extension}`))).map((scene) => scene.id);
const images = present(imageDir, "png");
const clips = present(clipDir, "mp4");
const anchorDir = path.join(projectDir, "assets", "anchors");
const anchorReady = fs.existsSync(anchorDir) && fs.readdirSync(anchorDir).some((entry) => /\.(png|jpe?g|webp)$/iu.test(entry));
const result = {
  project: storyboard?.title || path.basename(projectDir),
  storyboard: scenes.length === 6 ? "ready" : "needs_six_scenes",
  anchor: anchorReady ? "ready" : "pending",
  images: { ready: images.length, expected: scenes.length, ids: images },
  clips: { ready: clips.length, expected: scenes.length, ids: clips },
  nextAction: scenes.length !== 6 ? "Complete and validate storyboard.json" : !anchorReady ? "Generate and approve a character anchor" : images.length < scenes.length ? "Generate missing scene images" : clips.length < scenes.length ? "Generate or import missing image-to-video clips" : "Create narration, captions, and an editable timeline",
};
console.log(JSON.stringify(result, null, 2));
