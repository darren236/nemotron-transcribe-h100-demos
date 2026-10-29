#!/usr/bin/env python3
"""Generate original scene narration with the existing local Kokoro Sarah voice."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


ROOT = Path(__file__).resolve().parents[1]
IAN = Path("/home/darren/Projects/Ian_work/paper_animation/audio/kokoro")
OUT = ROOT / "video/public/narration"
LINES = {
    "identity": "On one H one hundred, Nemotron 3.5 Transcribe turns recorded speech into text, speaker tags, and word timings.",
    "transcript": "Here is the actual model response. Each word carries a start and end time, and speaker turns stay visible. This original conversation was synthesized locally for a repeatable test. The film compresses the timeline, while the transcript preserves the recording's timing. Inspect every detail in the live viewer.",
    "search": "Search the transcript to find a phrase and jump to its place in the recording. Click a word to hear that moment.",
    "srt": "Those same word timestamps can be grouped into subtitle cues and exported as an SRT file. The result stays linked to the exact audio used for this run.",
    "audit": "The output is real. Names and speaker turns still deserve a human listen. Raw response and model revision are saved.",
}


def main() -> None:
    tts = Kokoro(str(IAN / "kokoro-v1.0-int8-old.onnx"), str(IAN / "voices-v1.0-old.bin"))
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for scene, line in LINES.items():
        samples, rate = tts.create(line, voice="af_sarah", speed=1.06, lang="en-us")
        path = OUT / f"{scene}.wav"
        sf.write(path, np.asarray(samples, dtype=np.float32).reshape(-1), rate, subtype="PCM_16")
        manifest.append({"scene": scene, "text": line, "file": str(path.relative_to(ROOT)), "seconds": round(len(samples) / rate, 3)})
        print(f"{scene}: {len(samples) / rate:.2f}s")
    (ROOT / "video/narration_manifest.json").write_text(json.dumps({
        "provenance": "Original script, synthesized locally using Kokoro af_sarah; no external voice service.",
        "clips": manifest,
    }, indent=2) + "\n")


if __name__ == "__main__":
    main()
