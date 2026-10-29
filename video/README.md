# Nemotron 3.5 Transcribe on H100: demo video

A 60-second, 1920×1080, 30 fps Remotion composition (`NemotronTranscribeDemo`, 1800 frames). Everything under `video/` is self-contained. There is no external art, music or fonts.

The delivered video is driven by `result.props.json`, generated from the real H100 response. The composition still supports a clearly labelled placeholder for development when real props are omitted. Scene narration was synthesized locally with Kokoro Sarah and is bundled under `public/narration/`.

## Install

```bash
cd video
npm ci
```

All `remotion` and `@remotion/*` packages are pinned to 4.0.539 in the lockfile.

## Preview and render

```bash
npm run studio        # live preview; load result.props.json for real data
npm run typecheck     # tsc --noEmit

# render with real data
npm run render -- --props=./result.props.json

# check one frame
npx remotion still src/index.ts NemotronTranscribeDemo out/frame.png --frame=375 --props=./result.props.json
```

## Props shape

`result.props.json`:

```json
{
  "result": {
    "title": "…",
    "model": "…",
    "request_seconds": 0,
    "audio_duration_seconds": 0,
    "words": [{"word": "…", "start": 0.0, "end": 0.0, "speaker": "…"}],
    "demo_wav_path": "demo.wav"
  },
  "hardware": "NVIDIA H100",
  "search_query": "optional",
  "audit_note": "optional",
  "play_audio": false
}
```

- `result` is required. Omit `is_placeholder`; that flag exists only in the development placeholder (`src/placeholder.ts`). Because `--props` replaces `result` wholesale, the badge disappears with real data.
- `words[].speaker` may be a string, a number or `null`. Numbers display as `Speaker N`.
- `demo_wav_path` is a URL, or a path relative to `video/public/`. Copy the WAV to `video/public/demo.wav` and use `"demo.wav"`. Browsers cannot read arbitrary filesystem paths.
- `search_query` (optional) is the term for scene 4. If omitted, the most frequent word of 4+ letters is used and the scene says it was auto-selected.
- `audit_note` (optional) replaces the default provenance statement in scene 6.
- `play_audio` (optional, default `false`) plays the first 6 s of the WAV under scene 1.
- The five scene narration WAVs are loaded automatically for real data. To regenerate them on this host, run `python3 scripts/make_video_narration.py` from the repository root; the source Kokoro assets are in Ian_work, while the rendered WAVs are committed here.

## Scenes

| # | Scene | Time | What it shows |
|---|-------|------|---------------|
| 1 | Signal | 0–6 s | Title, WAV name and audio length. Live WAV spectrum, or a word-timing envelope when using the placeholder. |
| 2 | Model on H100 | 6–14 s | Model name, hardware label, WAV → model → words pipeline, audio length and request time counters. |
| 3 | Transcript | 14–34 s | Words appearing in speaker turns, current word highlighted with its start/end time, timeline rail with speaker-coloured ticks. The audio timeline is compressed to fit and labelled with the factor. |
| 4 | Search | 34–42 s | Query typed, match count, hit positions on the timeline, up to 3 hit snippets with timestamps. |
| 5 | SRT export | 42–52 s | First 3 SRT cues built from word timings, cue count, and the cue rule. |
| 6 | Audit | 52–60 s | Facts straight from the result, one derived ratio (labelled), and the audit note. |

## Data honesty

- Shown numbers are `request_seconds`, `audio_duration_seconds`, word and speaker counts, and word timings from the result.
- The only computed figures are audio ÷ request time (labelled "derived") and the timeline compression factor (labelled in scene 3).
- No model parameter counts, accuracy or latency claims are written into the video. Add them through `audit_note` only if they are sourced.
- Timeline timing, scene lengths and palette live in `src/theme.ts`.

## Legibility

Body text is 40 px or larger and labels are 28 px or larger on a 1080p canvas. The transcript shows one speaker turn at a time rather than a full page of text, so it holds up on a phone screen.

## Layout

```
src/index.ts          entry (registerRoot)
src/Root.tsx          Composition registration
src/NemotronDemo.tsx  scene sequencing
src/derive.ts         turns, search matches, SRT cues, time formatting
src/theme.ts          size, timing, palette
src/placeholder.ts    development placeholder
src/components.tsx    backdrop, scene frame, chips, timeline rail
src/scenes/           the six scenes
```

## Production and verification

Claude Code (Sonnet) authored the Remotion scene scaffold using `claude -p --model sonnet --permission-mode acceptEdits --allowedTools Read,Edit,Write` against a local project brief. No Brev credentials or unrelated private material were sent. Codex wired in `result.props.json`, narration, and the verified audio, then type-checked and rendered locally.

The final `out/nemotron-transcribe-demo.mp4` was checked as 60.011 seconds, H.264 1920×1080 at 30 fps with AAC audio. Stills from the final export were inspected, including the corrected model scene at 12.5 seconds. The final MP4 is committed; intermediate stills and `node_modules/` are ignored. Source, props, audio and lockfile are kept for rebuilding.
