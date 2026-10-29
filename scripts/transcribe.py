#!/usr/bin/env python3
"""Send one WAV recording to NVIDIA Nemotron 3.5 Transcribe on a local vLLM server."""

import argparse
import base64
import hashlib
import json
from pathlib import Path
import time
import urllib.error
import urllib.request
import wave

MODEL = "nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B"
MAX_TOKENS = 32768
PROMPT = (
    "Transcribe this audio with punctuation and capitalization. "
    "Include all spoken words and verbal fillers. "
    "Write numbers in their standard written form. "
    "Put speaker tags <spk:0> <spk:1> <spk:2> <spk:3> on the transcription."
)


def check_wav(path: Path) -> None:
    with wave.open(str(path), "rb") as recording:
        if recording.getnchannels() != 1 or recording.getframerate() != 16000:
            raise ValueError("Expected mono 16 kHz WAV; see the ffmpeg command in README.md")
        if recording.getsampwidth() != 2 or recording.getcomptype() != "NONE":
            raise ValueError("Expected uncompressed 16-bit PCM WAV")
        duration = recording.getnframes() / recording.getframerate()
        if duration > 3600:
            raise ValueError("Recording exceeds the model's documented one-hour limit")


def request_payload(audio: bytes) -> dict:
    encoded = base64.b64encode(audio).decode("ascii")
    return {
        "model": MODEL,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": PROMPT},
            {"type": "audio_url", "audio_url": {"url": f"data:audio/wav;base64,{encoded}"}},
        ]}],
        "temperature": 0,
        "top_p": 1.0,
        "max_tokens": MAX_TOKENS,
        "stream": False,
        "n": 1,
        "chat_template_kwargs": {"enable_thinking": False},
        "skip_special_tokens": False,
        "spaces_between_special_tokens": False,
        "seed": 0,
        "mm_processor_kwargs": {"capture_ctc_timestamps": True},
    }


def normalize(response: dict, audio_path: Path, audio: bytes, duration: float) -> dict:
    choice = response["choices"][0]
    if choice.get("finish_reason") == "length":
        raise ValueError(
            f"Transcript hit the {MAX_TOKENS}-token output limit; no result was saved. "
            "Split the recording into shorter clips and transcribe each one."
        )
    alignment = response.get("ctc_timestamps")
    if not isinstance(alignment, dict):
        raise ValueError("Server omitted ctc_timestamps; check the V1 runner and CTC middleware")
    if alignment.get("error") is not None:
        raise ValueError(f"CTC alignment failed: {alignment['error']}")
    original_words = alignment.get("words")
    if not isinstance(original_words, list) or not original_words:
        raise ValueError("Server returned no aligned words")
    words = []
    for item in original_words:
        word = str(item["word"]).strip()
        start = float(item["start"])
        end = float(item["end"])
        if not word or start < 0 or end < start or end > duration + 1:
            raise ValueError(f"Invalid aligned word: {item!r}")
        words.append({"word": word, "start": start, "end": end,
                      "speaker": str(item.get("speaker") or "spk:0")})
    content = choice["message"]["content"]
    if not isinstance(content, str):
        raise ValueError("Server returned a non-text transcript")
    return {
        "schema_version": 1,
        "status": "model_output",
        "title": audio_path.stem.replace("_", " "),
        "model": response.get("model", MODEL),
        "audio_file": audio_path.name,
        "audio_sha256": hashlib.sha256(audio).hexdigest(),
        "audio_duration_seconds": duration,
        "prompt": PROMPT,
        "text": content,
        "words": words,
        "alignment": alignment,
        "raw_response": response,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path, help="Mono 16 kHz PCM WAV")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000/v1")
    parser.add_argument("--timeout", type=int, default=600)
    args = parser.parse_args()
    check_wav(args.audio)
    audio = args.audio.read_bytes()
    with wave.open(str(args.audio), "rb") as recording:
        duration = recording.getnframes() / recording.getframerate()
    body = json.dumps(request_payload(audio)).encode("utf-8")
    url = args.base_url.rstrip("/") + "/chat/completions"
    request = urllib.request.Request(url, body, {"Content-Type": "application/json"})
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=args.timeout) as result:
            response = json.load(result)
    except urllib.error.HTTPError as error:
        detail = error.read(2000).decode("utf-8", "replace")
        raise SystemExit(f"Server returned HTTP {error.code}: {detail}") from error
    elapsed = time.monotonic() - started
    output = normalize(response, args.audio, audio, duration)
    output["request_seconds"] = round(elapsed, 3)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(f"Saved {len(output['words'])} aligned words to {args.output} in {elapsed:.2f}s")


if __name__ == "__main__":
    main()
