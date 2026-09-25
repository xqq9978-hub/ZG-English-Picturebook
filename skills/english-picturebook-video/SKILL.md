---
name: english-picturebook-video
description: "Create or revise short English picturebook animation packages: a child-friendly six-scene story, bilingual lines, consistent illustration and image-to-video prompts, and validated Seedance-ready assets. Use for original English children’s story videos, not for copying existing copyrighted picturebooks."
---

# English Picturebook Video

Create a production package for an original English picturebook short. The package must remain editable and usable without a paid video API.

## Choose the route

Ask only when the requested route is genuinely unclear. Otherwise use the user's stated choice.

- `manual-seedance` is the default: create and validate six image prompts and six five-second motion prompts; write `outputs/seedance-package.md`; wait for the user to generate and provide the clips.
- `connected-generator` is optional: only use an already available, configured video-generation connector. Explain the planned number of clips and obtain confirmation immediately before any billable generation. Never request or log API keys in chat or put them in project files.
- `local-motion-book` is the no-video-credit fallback: generate still illustrations, then use local motion, captions, and narration rather than claiming the images are generative video.

For actual connected video generation with ChatCut, read and follow its current video-generation, voice, and export instructions. Do not invent endpoint fields or substitute an unconfigured third-party API.

## Workflow

1. Read `references/story-rules.md` and `references/visual-continuity.md` before drafting a new story.
2. Confirm the project brief: audience, English level, duration/profile, story theme, and whether the user owns or may adapt the source material. Default to `vertical-short` when nothing conflicts with it.
3. Draft exactly six independent English lines. For every line supply a Chinese translation and `color`, `size`, `taste`, `verb`, and `place` keywords. Show the complete bilingual story package for approval before creating visual assets.
4. Create a visual bible and an anchor-image brief before generating scene images. Every scene with recurring characters must reference the approved anchor. If character drift persists through two prompt revisions, stop text-only retries and request a new or stronger anchor.
5. Write `storyboard.json`, run `scripts/validate-story.mjs`, and fix only reported violations. Do not silently modify an approved script.
6. Generate the manual Seedance package with `scripts/export-manual-seedance-package.mjs`. For connected generation, submit one dependent scene at a time and review the completed anchor-dependent output before moving on.
7. Run `scripts/workflow-state.mjs status` before resuming a project. Preserve valid assets while revising a later stage.

## Required output contract

Use `assets/profiles/vertical-short.json` for the default contract. `storyboard.json` is the source of truth for narration, translations, keywords, image prompts, and motion prompts. Every scene needs:

- a unique, ordered id;
- one English narration line and a Chinese translation;
- five keyword fields: `color`, `size`, `taste`, `verb`, `place`;
- an image prompt with the approved style and anchor constraints;
- a motion prompt for a five-second image-to-video clip;
- a duration from 4 to 15 seconds.

Read `references/provider-setup.md` only when the user selects a provider or asks about automation. Read `references/data-contract.md` when creating scripts or repairing project files.

## Boundaries

- Do not reproduce protected picturebook text, a living illustrator's signature style, copyrighted characters, or unlicensed music.
- Do not assume a video generator is free. Confirm before billable submission.
- Do not expose keys, cookies, local asset paths, private media, or user recordings in Git.
- Keep user-created video timelines editable. Export a final video only when the user asks for final render/download, unless they explicitly requested end-to-end automatic production.
