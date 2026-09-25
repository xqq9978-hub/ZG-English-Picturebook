# Data contract

`brief.json` contains user choices. `storyboard.json` is the production truth.

```json
{
  "schemaVersion": 1,
  "title": "Benny and the Apple",
  "profile": "vertical-short",
  "stylePrefix": "Children’s picture-book illustration...",
  "visualBible": {
    "anchorDescription": "Small brown bunny with long ears; a round bright-red smiling apple.",
    "mustKeep": ["rounded silhouettes", "wax crayon texture", "no on-screen text"]
  },
  "scenes": [
    {
      "id": "01",
      "title": "A bright surprise",
      "english": "Benny Bunny found a bright red apple.",
      "chinese": "本尼兔发现了一颗鲜红的苹果。",
      "keywords": {"color":"bright red", "size":"small", "taste":"sweet", "verb":"found", "place":"meadow"},
      "durationSeconds": 5,
      "imagePrompt": "...",
      "motionPrompt": "..."
    }
  ]
}
```

Store generated files by scene id. Do not edit prompt text inside exported videos or use generated output as a replacement for the structured source data.
