# Nemotron 3.5 Transcribe on H100

A reproducible set of three real H100 demos of [NVIDIA Nemotron 3.5 Transcribe](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B): an original two-speaker conversation, a JFK speech clip, and NASA Artemis mission radio. Each saved JSON contains the raw vLLM response, CTC word timings, model-assigned speaker tags, and the SHA-256 of its exact input WAV. The [gallery manifest](runs/gallery_manifest.json) records model revision, provenance and run measurements. These are examples, not accuracy or latency benchmarks.

The demo takes cues from NVIDIA's [podcast](https://nvidia-nemotron-transcribe.hf.space/podcast.html) and [subtitle](https://nvidia-nemotron-transcribe.hf.space/movie.html) examples: follow words during playback, find a phrase, and export SRT captions.

## Watch and use

- [60-second project overview](video/out/nemotron-transcribe-demo.mp4).
- Synchronized caption clips: [two-speaker conversation](video/out/conversation-caption.mp4), [JFK speech](video/out/jfk-caption.mp4), [Artemis radio](video/out/artemis-caption.mp4).
- [Three-demo guide](demos/README.md) with original audio sources, reproduction commands, raw outputs, SRT captions and provenance.

From this directory, start the static viewer:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. Select a recording to load its real model result and matching WAV. The viewer verifies the WAV SHA-256 before word-following playback, phrase search, and SRT download. You can also select another result JSON and matching WAV manually. The gallery replays saved inference; it does not start the H100 or make a new model request on each click.

## Repeat the H100 run

Follow [docs/H100_RUNBOOK.md](docs/H100_RUNBOOK.md) for Brev access, exact install/download/server/inference commands, and troubleshooting. [docs/RUN_LOG_2026-10-29.md](docs/RUN_LOG_2026-10-29.md) records the observed runs and checks. [BREV_INSTANCE.md](BREV_INSTANCE.md) records the instance choice and final state. The Brev instance `nemotron-transcribe-v1` in `nvaitc_workshop` was stopped after all results were saved.

The inference endpoint binds only to `127.0.0.1:8000` on the H100. It has no public authentication layer, so keep it on loopback and use SSH for remote access.

## Video production

Claude Code authored the Remotion scene scaffold from a local brief, following the Ian_work workflow. Codex wired in the verified model output, generated local Kokoro narration, checked the rendered frames, and exported the MP4. See [video/README.md](video/README.md) for render commands and scene details. The source, render inputs, and final MP4 are in Git; run `cd video && npm ci && npm run render -- --props=./result.props.json` to rebuild it.

The viewer and film use an NVIDIA-inspired palette: [NVIDIA Green `#76B900`, dark gray and white](https://www.nvidia.com/content/dam/en-zz/Solutions/about-us/documents/NVIDIA-Trademark-and-Logo-Usage-Guidelines.pdf). Their graphics are custom; no NVIDIA logo asset is embedded.

## Reference

- [NVIDIA model card and vLLM/CTC recipe](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B)
- [NVIDIA launch article](https://huggingface.co/blog/nvidia/nemotron-transcribe-granary)
