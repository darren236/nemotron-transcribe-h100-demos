#!/usr/bin/env python3
"""Verify every saved model demo against its audio and build captions/provenance."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import shutil
import wave

from finalize_run import make_srt


ROOT = Path(__file__).resolve().parents[1]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    catalog = json.loads((ROOT / "demos/catalog.json").read_text())
    prior = json.loads((ROOT / "runs/manifest.json").read_text())
    manifest = {
        "purpose": "Saved outputs from actual H100 Nemotron inference; not a benchmark",
        "model": prior["model"],
        "model_revision": prior["model_revision"],
        "nemo_speech_commit": prior["nemo_speech_commit"],
        "vllm_version": prior["vllm_version"],
        "demos": [],
    }
    for entry in catalog:
        audio_path = ROOT / entry["audio"]
        result_path = ROOT / entry["result"]
        source_path = ROOT / entry["source_file"]
        result = json.loads(result_path.read_text())
        with wave.open(str(audio_path), "rb") as wav:
            if wav.getnchannels() != 1 or wav.getframerate() != 16000 or wav.getsampwidth() != 2:
                raise ValueError(f"{entry['id']}: input must be mono 16 kHz PCM16")
            duration = wav.getnframes() / wav.getframerate()
        if result.get("status") != "model_output" or result.get("model") != prior["model"]:
            raise ValueError(f"{entry['id']}: expected real output from the recorded model")
        if result.get("audio_file") != audio_path.name or result.get("audio_sha256") != sha256(audio_path):
            raise ValueError(f"{entry['id']}: result does not match its WAV")
        if abs(result.get("audio_duration_seconds", -1) - duration) > 0.01:
            raise ValueError(f"{entry['id']}: duration mismatch")
        if not isinstance(result.get("raw_response"), dict) or result.get("alignment", {}).get("error") is not None:
            raise ValueError(f"{entry['id']}: missing raw response or CTC alignment error")
        words = result.get("words")
        if not isinstance(words, list) or not words:
            raise ValueError(f"{entry['id']}: no aligned words")
        if any(
            not word.get("word") or word["start"] < 0 or word["end"] < word["start"]
            or word["end"] > duration + 1
            or (i > 0 and word["start"] < words[i - 1]["start"])
            for i, word in enumerate(words)
        ):
            raise ValueError(f"{entry['id']}: invalid word order or timing")
        (ROOT / entry["srt"]).write_text(make_srt(words))
        video_audio = ROOT / "video/public" / audio_path.name
        if not video_audio.exists() or sha256(video_audio) != result["audio_sha256"]:
            shutil.copyfile(audio_path, video_audio)
        clip_props = {
            "result": {
                "title": entry["title"],
                "model": result["model"],
                "request_seconds": result["request_seconds"],
                "audio_duration_seconds": duration,
                "words": words,
                "demo_wav_path": audio_path.name,
            },
            "source_label": entry["source"],
        }
        props_path = ROOT / "video/clip-props" / f"{entry['id']}.json"
        props_path.parent.mkdir(parents=True, exist_ok=True)
        props_path.write_text(json.dumps(clip_props, ensure_ascii=False, indent=2) + "\n")
        manifest["demos"].append({
            "id": entry["id"],
            "title": entry["title"],
            "source": entry["source"],
            "source_url": entry["source_url"],
            "source_file": entry["source_file"],
            "source_sha256": sha256(source_path),
            "input_wav": entry["audio"],
            "input_sha256": result["audio_sha256"],
            "result": entry["result"],
            "result_sha256": sha256(result_path),
            "srt": entry["srt"],
            "video_props": str(props_path.relative_to(ROOT)),
            "video": entry["video"],
            "video_sha256": sha256(ROOT / entry["video"]) if (ROOT / entry["video"]).exists() else None,
            "duration_seconds": duration,
            "request_seconds": result["request_seconds"],
            "aligned_words": len(words),
            "speaker_tags": sorted({str(word["speaker"]) for word in words}),
            "alignment_error": None,
        })
    output = ROOT / "runs/gallery_manifest.json"
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    for demo in manifest["demos"]:
        count = len(demo["speaker_tags"])
        print(f"{demo['id']}: {demo['aligned_words']} words, {count} speaker tag{'s' if count != 1 else ''}, {demo['request_seconds']}s request")
    print(f"Saved {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
