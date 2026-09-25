#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [, , input] = process.argv;
if (!input) throw new Error("Usage: node export-manual-seedance-package.mjs <storyboard.json>");
const sourcePath = path.resolve(input);
const validator = path.join(path.dirname(import.meta.url.replace("file://", "")), "validate-story.mjs");
const check = spawnSync(process.execPath, [validator, sourcePath], { stdio: "inherit" });
if (check.status !== 0) process.exit(check.status || 1);
const story = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const lines = [
  `# ${story.title} — Manual Seedance Package`,
  "",
  `Profile: ${story.profile} · ${story.scenes.length} scenes · ${story.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0)} seconds`,
  "",
  "## Before generating",
  "",
  `Anchor description: ${story.visualBible.anchorDescription}`,
  "Generate and approve the anchor first. Reuse it for every recurring character scene.",
  "",
  "## Scenes",
];
for (const scene of story.scenes) {
  lines.push(
    "",
    `### ${scene.id} · ${scene.title}`,
    "",
    `**English:** ${scene.english}`,
    "",
    `**中文：** ${scene.chinese}`,
    "",
    `**Keywords:** color=${scene.keywords.color}; size=${scene.keywords.size}; taste=${scene.keywords.taste}; verb=${scene.keywords.verb}; place=${scene.keywords.place}`,
    "",
    "**Image prompt**",
    "",
    `${story.stylePrefix}\n\n${scene.imagePrompt}`,
    "",
    `Save as: \`assets/images/${scene.id}.png\``,
    "",
    `**Image-to-video prompt · ${scene.durationSeconds}s**`,
    "",
    scene.motionPrompt,
    "",
    `Save as: \`assets/clips/${scene.id}.mp4\``,
  );
}
const outputDir = path.join(path.dirname(sourcePath), "outputs");
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "seedance-package.md");
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(outputPath);
