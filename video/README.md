# Three caption demos

The three public MP4s are short Remotion renders driven by saved Nemotron 3.5 Transcribe responses from one H100. Each video plays the exact WAV sent to the model and highlights its CTC-aligned words at the returned times. The clips use original graphics in NVIDIA-inspired green, charcoal, and white.

| Clip | Input audio | Saved model output | Render props |
| --- | --- | --- | --- |
| [Conversation](out/conversation-caption.mp4) | [WAV](../assets/demo_conversation.wav) | [JSON](../runs/demo_conversation.json) | [Props](clip-props/conversation.json) |
| [JFK speech](out/jfk-caption.mp4) | [WAV](../assets/jfk_speech.wav) | [JSON](../runs/jfk_speech.json) | [Props](clip-props/jfk.json) |
| [Artemis radio](out/artemis-caption.mp4) | [WAV](../assets/artemis_houston.wav) | [JSON](../runs/artemis_houston.json) | [Props](clip-props/artemis.json) |

## Rebuild the clips

From the repository root, validate the saved results and regenerate the caption props and SRT files:

```bash
python3 scripts/build_gallery.py
```

Then render the three MP4s:

```bash
cd video
npm ci
npm run typecheck
npm run render
```

`npm run render` calls the three individual scripts in `package.json`. `scripts/build_gallery.py` checks and refreshes the matching WAV copies under `video/public/` from `assets/`. The `NemotronCaptionClip` composition reads a clip's `--props` JSON and its WAV from that folder. Its duration follows the input recording plus 0.4 seconds. The MP4s are H.264 video with AAC audio. [NVIDIA's model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B) documents the word timestamp output used here.

To regenerate the silent four-second GIF previews for the GitHub README:

```bash
cd ..
bash scripts/make_gifs.sh
```

The GIFs are excerpts of the three final MP4s. They contain no audio; each preview in the root README links to its own GitHub Pages player for the full clip with sound.

## Checks

`scripts/build_gallery.py` verifies that every saved response matches its input WAV by SHA-256, has aligned words in chronological order, and reports no CTC alignment error before generating props. The short videos display the model's unedited words, including mistakes. Their recorded request times are single observations and are not performance benchmarks.
