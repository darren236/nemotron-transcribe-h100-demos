# Repository plan: Nemotron 3.5 Transcribe demos

## Purpose

Show real use of `nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B` on one H100, then help a reader repeat the same inferences. Keep the showcase small and grounded in saved model output. Use an NVIDIA-inspired green, charcoal and white theme with original graphics.

## What visitors see first

The repository README should open with a still from the project video, a one-sentence description, a link to the 60-second overview, and three linked video cards. Each card should lead to the clip, the matching audio and saved result, and the guide section with its exact command. Linked thumbnail images provide a reliable preview in GitHub's README; the MP4 files remain directly available in the repository. A live gallery is optional for a later publication decision and is not required to understand or reproduce the demos.

| Demo | Short video | Reader sees | Reproduction |
| --- | --- | --- | --- |
| Two-speaker conversation | `video/out/conversation-caption.mp4` | Speaker-tagged, word-synced captions and turns from the original dialogue | Run the synthetic WAV through `scripts/transcribe.py`; inspect the words, speaker tags and SRT |
| JFK speech | `video/out/jfk-caption.mp4` | Word timestamps and SRT on a short human-speech recording | Download the cited source, convert to 16 kHz mono WAV, infer and export SRT |
| Artemis mission radio | `video/out/artemis-caption.mp4` | Transcription on authentic radio audio, including visible model imperfections | Download the cited source, convert, infer, and review uncertain words against the audio |

The 60-second `video/out/nemotron-transcribe-demo.mp4` explains the model-to-captions workflow. It complements the three source-led clips rather than replacing them.

## User guide

Make `docs/USER_GUIDE.md` the reader's entry point and keep `docs/H100_RUNBOOK.md` as the detailed record of the observed Brev run. The guide should contain:

1. **Prerequisites:** an H100 80 GB Linux instance, disk capacity for the BF16 checkpoint and environment, SSH access, Python tooling, and local `ffmpeg` for sample conversion. State that the three saved demos can be viewed without a GPU.
2. **Get the code and model:** clone the repository, install the NVIDIA NeMo Speech environment, download the exact Hugging Face model, and show the pinned revisions used for the recorded run. Explain that a current main-branch install may differ from the recorded environment.
3. **Serve inference:** run `scripts/serve_h100.sh` on the H100, keep the vLLM endpoint on loopback, and verify `/v1/models` before sending audio.
4. **Run each use case:** give one self-contained section per demo with source attribution, audio preparation, transfer, `scripts/transcribe.py` command, expected output files, and a small example of the relevant fields. Make the difference between transcription text, speaker tags, CTC word timings and generated SRT clear.
5. **Use your own recording:** convert a local recording to the expected WAV format, infer, check `ctc_timestamps.error`, and open the JSON with its matching WAV in the static viewer.
6. **Troubleshoot and stop:** cover the observed `ensurepip`, `Python.h`, model startup and SSH issues; explain how to stop the instance after results are copied. Link to the full run log for exact observations.

Avoid copying the model checkpoint or credentials into the Git repository. Include a concise copy-and-run path, with the longer command log available through links.

## Repository layout

```text
README.md                 showcase and start here
docs/USER_GUIDE.md        readable end-to-end setup and use-case instructions
docs/H100_RUNBOOK.md      exact Brev commands and troubleshooting
docs/RUN_LOG_2026-10-29.md observed execution record
demos/README.md           provenance and source details
scripts/                  H100 setup, server, inference, validation
assets/                   small source and converted audio files
runs/                     saved raw responses, manifests and SRT files
video/                    Remotion source, render inputs and short MP4s
index.html                optional local replay gallery
```

## Publication checks

- Every clip uses its matching saved H100 response and exact input audio; no clip presents invented model output.
- Every demo has a working video link, source attribution, input SHA-256, model revision, inference command and output link.
- A fresh reader can download the model, start the server, verify readiness and reproduce at least one result using the guide.
- The guide explicitly distinguishes saved-result playback from a new GPU inference request.
- Readable captions and thumbnails work at GitHub README width and on a phone.
- The run log records the verified final instance state and any remaining usage cost.

## Primary reference

- [NVIDIA model card and official inference guide](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B)
