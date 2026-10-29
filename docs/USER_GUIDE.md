# User guide: run Nemotron 3.5 Transcribe on an H100

This guide reproduces the three short videos in the [repository showcase](../README.md). They use [NVIDIA Nemotron 3.5 Transcribe 30B-A4B](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B), served with vLLM on one H100 80 GB. The model returns transcript text; this project also requests speaker tags and CTC-aligned word times, then turns those times into SRT captions.

You can [watch the clips](../README.md#watch-the-demos) and [replay the saved results](../README.md#explore-the-saved-results) without a GPU. The steps below make **new inference requests**. Run local commands from the root of this repository unless a step says “on the H100.”

## Before you start

- A Linux machine with one H100 80 GB, SSH access, and sufficient disk for the environment and BF16 model. The recorded run used a 256 GiB disk; its checkpoint was 62.86 GiB.
- A local checkout of this repository, Python 3, `scp`/`ssh`, and `ffmpeg` if you want to convert different source audio.
- A Brev instance is convenient but not required. The examples use the SSH alias `nemotron-transcribe-v1` and remote user `ubuntu`, matching the recorded run. Change those paths for another provider.

Keep the inference server on `127.0.0.1:8000` on the H100. The server has no authentication layer in this guide. No Hugging Face token was needed for the recorded download. Never commit cloud credentials, SSH keys, or the checkpoint to this repository.

## 1. Install NeMo Speech and download the model

Connect to the H100 and run this block **on the H100**. It pins the NeMo Speech and model revisions used for the saved demos; the [official model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B) also documents a current-main installation. The recorded image ran Python 3.12.3 and vLLM 0.32.0. Its CUDA driver was already installed.

```bash
sudo apt-get update
sudo apt-get install -y git curl python3.12-dev
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

git clone https://github.com/NVIDIA-NeMo/Speech.git ~/nemo-speech
cd ~/nemo-speech
git checkout 88846dcfa90233dce178cc3d5d9dd6065cdc8380
uv venv --python 3.13 .venv
UV_PROJECT_ENVIRONMENT="$PWD/.venv" uv sync --extra asr --extra vllm --locked --no-install-project
uv pip install --python .venv/bin/python --no-deps -e .
uv pip install --python .venv/bin/python --no-deps av==19.0.2 opencv-python-headless==5.0.0.93
source .venv/bin/activate
python -c 'import sys, vllm; print(sys.version, vllm.__version__)'

hf download nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B \
  --revision 9d8cd6b79bfdd427b6558a5fdbf76fcaf8c75341 \
  --local-dir ./NVIDIA-Nemotron-3.5-Transcribe-30B-A4B
```

The model download took about ten minutes on the recorded instance. The Hugging Face CLI may show a full-sized `.incomplete` checkpoint before its final rename; wait for the command to finish. Do not add the downloaded model directory to Git.

On the recorded instance, `uv sync` recreated the initial 3.13 virtual environment with Python 3.12.3, which is why `python3.12-dev` was installed. Check the printed Python and vLLM versions before continuing.

## 2. Copy the demo inputs and start the server

In a **local terminal**, set your SSH alias and copy the small scripts and three already converted WAVs. The preconverted files let you start without `ffmpeg`:

```bash
H100_HOST=nemotron-transcribe-v1
ssh "$H100_HOST" 'mkdir -p /home/ubuntu/nemotron-demo'
scp scripts/serve_h100.sh scripts/transcribe.py \
  assets/demo_conversation.wav assets/jfk_speech.wav assets/artemis_houston.wav \
  "$H100_HOST:/home/ubuntu/nemotron-demo/"
mkdir -p runs/reproduced
```

In a **separate terminal on the H100**, keep this server process running:

```bash
cd ~/nemo-speech
source .venv/bin/activate
bash ~/nemotron-demo/serve_h100.sh "$PWD/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B"
```

Startup loads the checkpoint and warms kernels; it can take several minutes. From the local terminal, check readiness through SSH before sending requests:

```bash
ssh "$H100_HOST" 'curl -fsS http://127.0.0.1:8000/v1/models'
```

The server script follows NVIDIA's one-H100 BF16 vLLM recipe. It enables the V1 runner and CTC timestamp middleware, which are needed for the word timing fields used by the videos.

## 3. Run the three use cases

Each command below sends its WAV to the loopback vLLM endpoint **on the H100**, saves a new JSON there, then copies it back to `runs/reproduced/` locally. The included JSON under `runs/` stays untouched. Run `scripts/export_srt.py` locally to verify the audio hash and create subtitles from the returned words.

### 1. Two-speaker conversation

The [original dialogue script](../assets/demo_conversation_script.json) was synthesized locally with two Kokoro voices. This example shows the model's speaker-tagged transcript and timed turns; the tags are model output, not a manually supplied speaker list.

```bash
ssh "$H100_HOST" 'python3 /home/ubuntu/nemotron-demo/transcribe.py /home/ubuntu/nemotron-demo/demo_conversation.wav --output /home/ubuntu/nemotron-demo/conversation_new.json'
scp "$H100_HOST:/home/ubuntu/nemotron-demo/conversation_new.json" runs/reproduced/
python3 scripts/export_srt.py runs/reproduced/conversation_new.json assets/demo_conversation.wav --output runs/reproduced/conversation_new.srt
```

Compare your result with the [saved JSON](../runs/demo_conversation.json), [SRT](../runs/demo_conversation.srt), and [34-second video](../video/out/conversation-caption.mp4). The recorded request returned 90 aligned words and two speaker tags. Exact text and timing may differ with another software revision.

### 2. JFK speech

This human-speech clip comes from [OpenAI Whisper's JFK test fixture](https://github.com/openai/whisper/blob/main/tests/jfk.flac). The repository includes both the [original FLAC](../assets/originals/jfk.flac) and the 16 kHz mono PCM WAV sent to the model. To remake the WAV locally:

```bash
ffmpeg -i assets/originals/jfk.flac -ac 1 -ar 16000 -c:a pcm_s16le /tmp/jfk_speech_rebuilt.wav
```

The committed WAV is already copied to the H100 by step 2. Run:

```bash
ssh "$H100_HOST" 'python3 /home/ubuntu/nemotron-demo/transcribe.py /home/ubuntu/nemotron-demo/jfk_speech.wav --output /home/ubuntu/nemotron-demo/jfk_new.json'
scp "$H100_HOST:/home/ubuntu/nemotron-demo/jfk_new.json" runs/reproduced/
python3 scripts/export_srt.py runs/reproduced/jfk_new.json assets/jfk_speech.wav --output runs/reproduced/jfk_new.srt
```

Compare the [saved JSON](../runs/jfk_speech.json), [SRT](../runs/jfk_speech.srt), and [11-second video](../video/out/jfk-caption.mp4). This use case highlights word timing and subtitle export for a single speaker.

### 3. Artemis mission radio

This recording is from the [NASA Artemis Audio Library](https://www.nasa.gov/artemisaudio/). The repository keeps the [source MP3](../assets/originals/artemis_houston.mp3) and exact model-input WAV. To remake the WAV locally:

```bash
ffmpeg -i assets/originals/artemis_houston.mp3 -ac 1 -ar 16000 -c:a pcm_s16le /tmp/artemis_houston_rebuilt.wav
```

The committed WAV is already copied to the H100. Run:

```bash
ssh "$H100_HOST" 'python3 /home/ubuntu/nemotron-demo/transcribe.py /home/ubuntu/nemotron-demo/artemis_houston.wav --output /home/ubuntu/nemotron-demo/artemis_new.json'
scp "$H100_HOST:/home/ubuntu/nemotron-demo/artemis_new.json" runs/reproduced/
python3 scripts/export_srt.py runs/reproduced/artemis_new.json assets/artemis_houston.wav --output runs/reproduced/artemis_new.srt
```

Compare the [saved JSON](../runs/artemis_houston.json), [SRT](../runs/artemis_houston.srt), and [22-second video](../video/out/artemis-caption.mp4). The saved video deliberately shows unedited model output. Listen back and correct uncertain radio words before using captions in another project.

## 4. Understand the output

`scripts/transcribe.py` writes the full `raw_response` plus a simpler structure:

| JSON field | Meaning |
| --- | --- |
| `text` | The generated transcript, including requested speaker tags. |
| `words` | Word text, start/end seconds, and speaker tag from CTC alignment. |
| `alignment.error` | Must be `null` before using the timestamps. |
| `audio_sha256` | SHA-256 of the exact WAV sent to the model. |
| `request_seconds` | One measured request on a warm server; not a benchmark. |

The SRT exporter groups nearby words into readable cues and prefixes each cue with its model-assigned speaker label. The [provenance manifest](../runs/gallery_manifest.json) contains the recorded model revision, source hashes, input hashes, and per-demo counts.

## 5. Use a recording of your own

Convert a recording **locally** to uncompressed 16 kHz, mono, 16-bit PCM WAV. Use a filename without spaces for these copy-and-run examples:

```bash
ffmpeg -i my_recording.mp3 -ac 1 -ar 16000 -c:a pcm_s16le my_recording.wav
scp my_recording.wav "$H100_HOST:/home/ubuntu/nemotron-demo/"
ssh "$H100_HOST" 'python3 /home/ubuntu/nemotron-demo/transcribe.py /home/ubuntu/nemotron-demo/my_recording.wav --output /home/ubuntu/nemotron-demo/my_recording.json'
scp "$H100_HOST:/home/ubuntu/nemotron-demo/my_recording.json" runs/reproduced/
python3 scripts/export_srt.py runs/reproduced/my_recording.json my_recording.wav --output runs/reproduced/my_recording.srt
```

Check `alignment.error` and listen through the audio, particularly at speaker changes. Open the [local viewer](../index.html), choose the new result JSON and its matching WAV, and inspect the word-following display. The viewer plays saved output; running the inference command above is what makes a new model request.

## Troubleshooting and shutdown

| Symptom | Action |
| --- | --- |
| `ensurepip is not available` | Use `uv` as in step 1; the recorded Ubuntu image lacked the matching `python3-venv` package. |
| `Python.h: No such file or directory` at vLLM startup | Install `python3.12-dev` on the H100, then restart the server. |
| `/v1/models` refuses connections | Keep the server terminal open and watch for startup completion or a real error; loading and warmup can take several minutes. |
| JSON has no `ctc_timestamps` | Check that `serve_h100.sh` was used with the V1 runner and CTC middleware. |
| `alignment.error` is not `null` | Review the recording and server log; do not use those word times as subtitles. |
| Brev reports `STARTING` while SSH works | Check `brev ls --all`; the recorded run briefly accepted `scp` while the Brev copy command still refused. |

After copying and checking the results, stop the server and **stop the GPU instance**. With Brev:

```bash
brev stop nemotron-transcribe-v1
brev ls --all
```

Confirm the final status is `STOPPED`; a stopped disk can still incur a storage charge. The [H100 runbook](H100_RUNBOOK.md) has the complete setup and troubleshooting record, and the [run log](RUN_LOG_2026-10-29.md) records the observed instance state and timings. The three request times in that log are individual observations, not performance claims.
