#!/usr/bin/env python3
"""Create a short, original two-speaker recording for repeatable ASR demos."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

SCRIPT = [
    ("af_sarah", "I have a recording from our product review. Can we turn it into searchable captions?"),
    ("am_michael", "Yes. First, we send the audio to Nemotron Transcribe on one H one hundred GPU."),
    ("af_sarah", "Will it tell us who is speaking and when each word starts?"),
    ("am_michael", "That's the idea. We ask for speaker tags and word timestamps, then check the result against the recording."),
    ("af_sarah", "Great. I can search for product review, jump to that moment, and export subtitle captions."),
    ("am_michael", "Exactly. The transcript is useful, but a human should still review names and speaker changes."),
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, type=Path, help="Downloaded Kokoro ONNX model")
    parser.add_argument("--voices", required=True, type=Path, help="Matching Kokoro voices file")
    parser.add_argument("--output", required=True, type=Path, help="Destination mono 16 kHz WAV")
    args = parser.parse_args()
    for path in (args.model, args.voices):
        if not path.is_file():
            parser.error(f"File not found: {path}")

    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro

    tts = Kokoro(str(args.model), str(args.voices))
    parts = []
    line_times = []
    rate = 16000
    cursor = 0
    for voice, line in SCRIPT:
        samples, source_rate = tts.create(line, voice=voice, speed=1.02, lang="en-us")
        if source_rate != 24000:
            raise RuntimeError(f"Expected 24000 Hz Kokoro audio, got {source_rate}")
        mono = np.asarray(samples, dtype=np.float32).reshape(-1)
        target_length = round(len(mono) * rate / source_rate)
        resampled = np.interp(
            np.arange(target_length) * source_rate / rate,
            np.arange(len(mono)),
            mono,
        ).astype(np.float32)
        start = cursor / rate
        parts.append(resampled)
        cursor += len(resampled)
        end = cursor / rate
        line_times.append({"voice": voice, "text": line, "start": round(start, 3), "end": round(end, 3)})
        silence = np.zeros(round(0.38 * rate), dtype=np.float32)
        parts.append(silence)
        cursor += len(silence)
    output = args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    sf.write(output, np.concatenate(parts), rate, subtype="PCM_16")
    output.with_name(f"{output.stem}_script.json").write_text(json.dumps({
        "provenance": "Original script; locally synthesized with Kokoro voices af_sarah and am_michael.",
        "note": "The reference text and line boundaries are for auditing, not model output.",
        "lines": line_times,
    }, indent=2) + "\n")
    print(f"{output}: {cursor / rate:.2f}s")


if __name__ == "__main__":
    main()
