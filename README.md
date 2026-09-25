# English Picturebook Video

An installable Codex Skill for turning an original English picturebook idea into a six-scene animated-short production package: child-friendly English, Chinese line translations, searchable scene keywords, illustration prompts, five-second image-to-video prompts, and an editable asset manifest.

It is deliberately usable without a video API. The default `manual-seedance` route produces a reviewed prompt package for use in Seedance's UI. An optional connected video-generator route may be used only after the user has configured a provider and approved the spend. A local motion-book route remains available when no video-generation provider is configured.

## Install

Install the subdirectory `skills/english-picturebook-video` with your Codex GitHub Skill installer. For a checkout, the relevant path is:

```text
skills/english-picturebook-video
```

After installation, start a new Codex turn and ask, for example:

```text
Use $english-picturebook-video to make a 30-second English picturebook animation about a shy rabbit helping a friendly apple get home.
```

## What it creates

Each story lives outside the Skill installation, in a project folder selected by the user:

```text
my-story/
  brief.json
  storyboard.json
  assets/
    anchors/
    images/
    clips/
    audio/
  outputs/
    seedance-package.md
  workflow-state.json
```

The supplied scripts need Node.js 22 or newer and use no third-party packages.

## Local scripts

```bash
# Create an empty project contract
node skills/english-picturebook-video/scripts/init-project.mjs ./my-story --title "Benny and the Apple"

# Validate the final six-scene storyboard before generating paid assets
node skills/english-picturebook-video/scripts/validate-story.mjs ./my-story/storyboard.json --write-report

# Create a copyable manual Seedance prompt package
node skills/english-picturebook-video/scripts/export-manual-seedance-package.mjs ./my-story/storyboard.json

# See which asset stage is ready next
node skills/english-picturebook-video/scripts/workflow-state.mjs status ./my-story
```

## BytePlus Ark automation

The optional `byteplus-ark` route automates Seedream illustration generation and Seedance image-to-video task submission. It does not create a BytePlus account or API keys on a user's behalf, and it refuses to submit paid generation work unless the user passes `--confirm`.

1. Create a local `.env` from `.env.example`, then add the user's `ARK_API_KEY` and, for video, their `LAS_API_KEY`. Never commit that file.
2. Run the no-cost readiness check:

   ```bash
   node skills/english-picturebook-video/scripts/byteplus-ark.mjs doctor ./my-story
   ```

3. Generate and approve one character anchor, then generate the six scene images:

   ```bash
   node skills/english-picturebook-video/scripts/byteplus-ark.mjs anchor ./my-story --confirm
   node skills/english-picturebook-video/scripts/byteplus-ark.mjs images ./my-story --anchor-approved --confirm
   ```

4. Submit and review one five-second video scene at a time; then poll and download the finished clip:

   ```bash
   node skills/english-picturebook-video/scripts/byteplus-ark.mjs video ./my-story --scene 01 --scene-approved --confirm
   node skills/english-picturebook-video/scripts/byteplus-ark.mjs status ./my-story
   ```

See `skills/english-picturebook-video/references/byteplus-ark.md` for prerequisites, safety limits, and the user-facing workflow.

The `examples/benny-and-the-apple/` folder is a fully valid reference project.

## Provider policy

- Do not put keys, account cookies, provider URLs with credentials, generated media, or user recordings in Git.
- The Skill never claims Seedance or another video API is free. Ask before submitting a billable generation job.
- Keep an approved anchor image for every recurring character and reuse it in every related scene.
- Use original, licensed, or public-domain stories and assets only. Do not imitate a living illustrator's signature style or copyrighted characters.

## License

Apache-2.0. Third-party models, fonts, voice services, generated media, and user-supplied assets retain their own terms.
