# Nemotron 3.5 Transcribe on H100

A reproducible, single H100 demo of [NVIDIA Nemotron 3.5 Transcribe](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B). The source is an original 34.24-second, two-speaker synthetic conversation. On 29 October 2026, the model returned 90 CTC-aligned words with two alternating speaker tags and no alignment error. The vLLM request took 2.666 seconds after server warmup. This one recording is a demonstration, not an accuracy or latency benchmark.

The demo takes cues from NVIDIA's [podcast](https://nvidia-nemotron-transcribe.hf.space/podcast.html) and [subtitle](https://nvidia-nemotron-transcribe.hf.space/movie.html) examples: follow words during playback, find a phrase, and export SRT captions.

## Watch and use

- [Finished 60-second video](video/out/nemotron-transcribe-demo.mp4) (committed with the demo).
- [Real model result](runs/demo_conversation.json), [SRT](runs/demo_conversation.srt), and [provenance manifest](runs/manifest.json).
- [Demo audio](assets/demo_conversation.wav) and [source script](assets/demo_conversation_script.json).

From this directory, start the static viewer:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. It loads the real result and its matching WAV automatically, verifies the WAV SHA-256, and enables word-following playback, phrase search, and SRT download. You can also select another result JSON and matching WAV manually. File selection stays in the browser session; the static viewer makes no API requests.

## Repeat the H100 run

Follow [docs/H100_RUNBOOK.md](docs/H100_RUNBOOK.md) for Brev access, exact install/download/server/inference commands, and troubleshooting. [docs/RUN_LOG_2026-10-29.md](docs/RUN_LOG_2026-10-29.md) records the observed run and checks. [BREV_INSTANCE.md](BREV_INSTANCE.md) records the instance choice and final state. The Brev instance `nemotron-transcribe-v1` in `nvaitc_workshop` was stopped after the result was saved.

The inference endpoint binds only to `127.0.0.1:8000` on the H100. It has no public authentication layer, so keep it on loopback and use SSH for remote access.

## Video production

Claude Code authored the Remotion scene scaffold from a local brief, following the Ian_work workflow. Codex wired in the verified model output, generated local Kokoro narration, checked the rendered frames, and exported the MP4. See [video/README.md](video/README.md) for render commands and scene details. The source, render inputs, and final MP4 are in Git; run `cd video && npm ci && npm run render -- --props=./result.props.json` to rebuild it.

The viewer and film use an NVIDIA-inspired palette: [NVIDIA Green `#76B900`, dark gray and white](https://www.nvidia.com/content/dam/en-zz/Solutions/about-us/documents/NVIDIA-Trademark-and-Logo-Usage-Guidelines.pdf). Their graphics are custom; no NVIDIA logo asset is embedded.

## Reference

- [NVIDIA model card and vLLM/CTC recipe](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B)
- [NVIDIA launch article](https://huggingface.co/blog/nvidia/nemotron-transcribe-granary)
