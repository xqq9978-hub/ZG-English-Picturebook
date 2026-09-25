# BytePlus Ark route

Use this route when a user wants automated Seedream still images and Seedance image-to-video clips through their own BytePlus account.

## What the user must provide

1. A BytePlus account with the relevant models activated and billing available.
2. `ARK_API_KEY` for Ark image generation.
3. `LAS_API_KEY` for LAS Seedance video generation. This may be a separate credential; do not assume an Ark key works for LAS.
4. An original or licensed story and approval to make the stated paid requests.

The user puts keys only in a local ignored `.env` file or environment variables. Never ask them to paste keys into chat, a prompt, `storyboard.json`, or Git.

## Setup

From a project directory containing an approved `storyboard.json`:

```bash
cp /path/to/skill/.env.example .env
# Edit .env locally. Add ARK_API_KEY and LAS_API_KEY.
node /path/to/skill/scripts/byteplus-ark.mjs doctor .
```

The adapter resolves `.env` in the project directory first, then the current directory. Environment variables take precedence.

## Cost boundary and sequence

`doctor` is read-only and makes no provider call. Before a command with `--confirm`, state the number of planned requests:

- `anchor`: one Seedream image request.
- `images`: one Seedream image request per missing scene, normally six.
- `video --scene <id>`: one Seedance video task for one 4–15 second scene.

The adapter requires `--anchor-approved` after the user reviews the anchor and `--scene-approved` after the user reviews a scene image. Do not submit all videos as a batch. After a video task succeeds, download and review that clip before submitting the next scene. The provider's generated URLs can expire, so use `status` promptly after a task succeeds.

## Commands

```bash
# Validate keys and display readiness without a billable request.
node byteplus-ark.mjs doctor ./my-story

# Submit one anchor-image request. It is saved under assets/anchors/.
node byteplus-ark.mjs anchor ./my-story --confirm

# After anchor approval, submit only missing scene-image requests.
node byteplus-ark.mjs images ./my-story --anchor-approved --confirm

# Submit exactly one image-to-video task.
node byteplus-ark.mjs video ./my-story --scene 01 --scene-approved --confirm

# Poll all known video tasks and download completed MP4 files.
node byteplus-ark.mjs status ./my-story
```

## Implementation notes

Ark image generation uses the ModelArk image endpoint. The video adapter uses the LAS Seedance task endpoint and the returned task ID; it polls the task endpoint for completion. Scene images are passed to Seedance using their temporary provider URL, which avoids publishing a user's local asset to a public host. The local copy remains the durable project asset.

The adapter intentionally uses only documented request fields. If BytePlus changes model IDs, endpoints, terms, or supported dimensions, users can override the model and base URL in `.env` after checking the current provider documentation.
