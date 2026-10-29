#!/usr/bin/env python3
"""Verify the H100 response and create the viewer/video delivery files."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]


def srt_clock(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3600000)
    minutes, millis = divmod(millis, 60000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def label(value: str) -> str:
    match = re.fullmatch(r"(?:<?spk:)?(\d+)>?", str(value))
    return f"Speaker {int(match.group(1)) + 1}" if match else str(value)


def make_srt(words: list[dict]) -> str:
    cues = []
    current = []

    def flush() -> None:
        if not current:
            return
        first, last = current[0], current[-1]
        cues.append(
            f"{len(cues) + 1}\n{srt_clock(first['start'])} --> {srt_clock(last['end'])}\n"
            f"{label(first['speaker'])}: {' '.join(w['word'] for w in current)}\n"
        )
        current.clear()

    for word in words:
        if current and (
            word["speaker"] != current[0]["speaker"]
            or word["start"] - current[0]["start"] > 6
            or word["start"] - current[-1]["end"] > 1.5
        ):
            flush()
        current.append(word)
        if len(current) >= 14 or re.search(r"[.!?]$", word["word"]):
            flush()
    flush()
    return "\n".join(cues)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-revision", required=True)
    parser.add_argument("--speech-commit", required=True)
    args = parser.parse_args()
    path = ROOT / "runs/demo_conversation.json"
    result = json.loads(path.read_text())
    audio = ROOT / "assets/demo_conversation.wav"
    if result["status"] != "model_output" or result["audio_file"] != audio.name:
        raise ValueError("Expected a real model result for demo_conversation.wav")
    actual_hash = hashlib.sha256(audio.read_bytes()).hexdigest()
    if actual_hash != result["audio_sha256"]:
        raise ValueError("Result and audio SHA-256 do not match")
    words = result["words"]
    if not words or any(w["end"] < w["start"] for w in words):
        raise ValueError("No valid aligned words")
    if any(words[i]["start"] > words[i + 1]["start"] for i in range(len(words) - 1)):
        raise ValueError("Word starts are not chronological")

    (ROOT / "runs/demo_conversation.srt").write_text(make_srt(words))
    manifest = {
        "project": "Nemotron 3.5 Transcribe recorded-audio demo",
        "model": result["model"],
        "model_revision": args.model_revision,
        "nemo_speech_commit": args.speech_commit,
        "vllm_version": "0.32.0",
        "runtime": "single NVIDIA H100 80 GB on Brev nvaitc_workshop, local-loopback vLLM",
        "recording": "original two-speaker synthetic audio from local Kokoro af_sarah and am_michael",
        "audio_sha256": actual_hash,
        "audio_duration_seconds": result["audio_duration_seconds"],
        "request_seconds": result["request_seconds"],
        "aligned_word_count": len(words),
        "speaker_tags": sorted({str(w["speaker"]) for w in words}),
        "alignment_error": result["alignment"].get("error"),
        "verification": "SHA-256 match and schema/timestamp checks passed; human listening review recorded separately.",
        "source_model_card": "https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B",
    }
    (ROOT / "runs/manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Verified {len(words)} aligned words")


if __name__ == "__main__":
    main()
