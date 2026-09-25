# Provider setup

Choose a route before asset generation.

## Manual Seedance

This is the default portable route. Generate the anchor and scene images through the user's Seedance web workflow, then upload each approved image with the matching motion prompt to create the clip. Save the returned files as `assets/images/<scene-id>.png` and `assets/clips/<scene-id>.mp4`.

Run `export-manual-seedance-package.mjs` after the storyboard is approved. It makes one copyable image prompt and one five-second motion prompt per scene. The user controls their own account, payments, and uploads.

## Connected generator

Use this route only when an already configured generation connector is available. Before a paid submission, state the number of intended clips, duration, aspect ratio, and that generation may consume credits. Submit anchor-dependent scenes sequentially. Track jobs with the connector's own task-status tool, and review an output before spending on the next dependent scene.

Do not silently upload private local images to a public URL. A direct API integration needs a user-approved, provider-compatible media transfer mechanism. Keys belong in a local ignored environment file, never in `brief.json`, `storyboard.json`, prompts, command arguments, or Git.

## Local motion-book

Use generated still images, narration, caption timing, slow pan/zoom, and crossfades when the user has no video generation credits. Label this output accurately as a motion-book or illustrated video; it is not a generative image-to-video result.
