#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , target, ...args] = process.argv;
if (!target) throw new Error("Usage: node init-project.mjs <project-directory> --title <title>");
const titleIndex = args.indexOf("--title");
const title = titleIndex >= 0 ? args[titleIndex + 1] : "";
if (!title) throw new Error("--title is required");
const projectDir = path.resolve(target);
if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length) throw new Error(`Project directory is not empty: ${projectDir}`);
for (const dir of ["assets/anchors", "assets/images", "assets/clips", "assets/audio", "outputs"]) fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
for (const file of ["assets/anchors/.gitkeep", "assets/images/.gitkeep", "assets/clips/.gitkeep", "assets/audio/.gitkeep"]) fs.writeFileSync(path.join(projectDir, file), "");
const brief = {
  schemaVersion: 1,
  title,
  audienceAge: "4-8",
  englishLevel: "CEFR pre-A1 to A1",
  profile: "vertical-short",
  route: "manual-seedance",
  theme: "",
  sourceRights: "original",
};
const storyboard = {
  schemaVersion: 1,
  title,
  profile: "vertical-short",
  stylePrefix: "Children’s picture-book illustration, wax crayon and colored-pencil cartoon, cute rounded simple shapes, bright yet soft colors, visible directional crayon strokes, grainy uneven coloring, clear paper texture, short repeated scribble strokes in grass and backgrounds. Warm, playful atmosphere. No text, letters, logos, watermarks, or interface elements.",
  visualBible: { anchorDescription: "", mustKeep: ["rounded silhouettes", "wax crayon texture", "no on-screen text"] },
  scenes: [],
};
fs.writeFileSync(path.join(projectDir, "brief.json"), `${JSON.stringify(brief, null, 2)}\n`);
fs.writeFileSync(path.join(projectDir, "storyboard.json"), `${JSON.stringify(storyboard, null, 2)}\n`);
fs.writeFileSync(path.join(projectDir, "workflow-state.json"), `${JSON.stringify({ schemaVersion: 1, project: title, stages: { story: "draft", anchor: "pending", images: "pending", clips: "pending", narration: "pending", timeline: "pending" } }, null, 2)}\n`);
console.log(projectDir);
