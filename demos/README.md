# Three real Nemotron transcription demos

For H100 setup and one command per use case, start with the [README guide](../README.md#run-it-on-an-h100).

The [viewer](../viewer.html) lets you switch among three recordings. Every listed JSON is a saved response from `nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B` on the `nvaitc_workshop` H100, with the raw vLLM response, CTC word timings, speaker tags, and a SHA-256 binding it to the exact WAV. The browser rechecks that hash before enabling playback. The recording switcher replays saved inference; it does not make a new GPU request on each click.

| Demo | Audio | What it shows |
| --- | --- | --- |
| Two-speaker conversation | [Original Kokoro-generated dialogue](../assets/demo_conversation.wav) | [Play caption clip](https://darren236.github.io/nemotron-transcribe-h100-demos/conversation.html), word-level sync, six speaker turns, search and SRT export. |
| JFK speech | [11-second human-speech clip](../assets/jfk_speech.wav) | [Play caption clip](https://darren236.github.io/nemotron-transcribe-h100-demos/jfk.html) and search on a public historical recording. Source: [OpenAI Whisper test fixture](https://github.com/openai/whisper/blob/main/tests/jfk.flac). |
| Artemis mission radio | [22-second NASA radio clip](../assets/artemis_houston.wav) | [Play caption clip](https://darren236.github.io/nemotron-transcribe-h100-demos/artemis.html) and unedited model output on authentic mission audio. Source: [NASA Artemis Audio Library](https://www.nasa.gov/artemisaudio/). |

The original JFK FLAC and NASA MP3 are retained in `assets/originals/`. NASA describes its Artemis audio as available under its [media usage guidelines](https://www.nasa.gov/artemisaudio/). The converted WAVs are mono, 16 kHz, PCM16, matching the inference script's input requirements. See [runs/gallery_manifest.json](../runs/gallery_manifest.json) for source and input hashes, model revision, request times, alignment status and output paths. The radio transcript is unedited model output and should be checked against the recording before reusing its captions. The examples are demonstrations, not a benchmark or a claim of perfect accuracy.

## Reproduce the additional inferences

Start `nemotron-transcribe-v1` in `nvaitc_workshop`, following the [H100 runbook](../docs/H100_RUNBOOK.md), and wait for `curl -fsS http://127.0.0.1:8000/v1/models` to succeed **on the instance**. Keep vLLM on loopback. From the repository root, copy the standardized audio and script through the Brev SSH configuration:

```bash
scp assets/jfk_speech.wav assets/artemis_houston.wav scripts/transcribe.py \
  nemotron-transcribe-v1:/home/ubuntu/nemotron-demo/
ssh nemotron-transcribe-v1 \
  'python3 /home/ubuntu/nemotron-demo/transcribe.py /home/ubuntu/nemotron-demo/jfk_speech.wav --output /home/ubuntu/nemotron-demo/jfk_speech.json'
ssh nemotron-transcribe-v1 \
  'python3 /home/ubuntu/nemotron-demo/transcribe.py /home/ubuntu/nemotron-demo/artemis_houston.wav --output /home/ubuntu/nemotron-demo/artemis_houston.json'
scp nemotron-transcribe-v1:/home/ubuntu/nemotron-demo/jfk_speech.json runs/
scp nemotron-transcribe-v1:/home/ubuntu/nemotron-demo/artemis_houston.json runs/
python3 scripts/build_gallery.py
```

The source files were downloaded with:

```bash
mkdir -p assets/originals
curl -fsSL https://raw.githubusercontent.com/openai/whisper/main/tests/jfk.flac \
  -o assets/originals/jfk.flac
curl -fsSL https://www.nasa.gov/wp-content/uploads/2026/01/artemis-ii-houston-we-have-you-loud-and-clear-1.mp3 \
  -o assets/originals/artemis_houston.mp3
```

The source conversions used the bundled ffmpeg binary after `npm ci` in `video/`:

```bash
REMOTION_FFMPEG=video/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg
"$REMOTION_FFMPEG" -i assets/originals/jfk.flac -ac 1 -ar 16000 -c:a pcm_s16le assets/jfk_speech.wav
"$REMOTION_FFMPEG" -i assets/originals/artemis_houston.mp3 -ac 1 -ar 16000 -c:a pcm_s16le assets/artemis_houston.wav
```

For a fresh audio file, convert it the same way, copy it to the H100, and run `scripts/transcribe.py` against the local vLLM endpoint. Its JSON can be loaded into the viewer with the matching WAV even before you add it to the gallery. Stop the H100 when inference is finished.
