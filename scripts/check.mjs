import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const skillDir = path.join(root, "skills", "english-picturebook-video");
const files = [
  path.join(skillDir, "scripts", "init-project.mjs"),
  path.join(skillDir, "scripts", "validate-story.mjs"),
  path.join(skillDir, "scripts", "export-manual-seedance-package.mjs"),
  path.join(skillDir, "scripts", "byteplus-ark.mjs"),
  path.join(skillDir, "scripts", "workflow-state.mjs"),
];
for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing required script: ${file}`);
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Syntax check failed: ${file}`);
}
const example = path.join(root, "examples", "benny-and-the-apple", "storyboard.json");
const result = spawnSync(process.execPath, [path.join(skillDir, "scripts", "validate-story.mjs"), example], { stdio: "inherit" });
if (result.status !== 0) throw new Error("Example storyboard did not validate");
console.log("english-picturebook-video checks: ok");
