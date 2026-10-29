#!/usr/bin/env python3
"""Verify a saved inference result against its WAV, then export SRT captions."""

import argparse
import hashlib
import json
from pathlib import Path

from finalize_run import make_srt


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("result", type=Path, help="JSON written by scripts/transcribe.py")
    parser.add_argument("audio", type=Path, help="The exact WAV used for inference")
    parser.add_argument("--output", required=True, type=Path, help="Destination SRT path")
    args = parser.parse_args()

    result = json.loads(args.result.read_text())
    actual_hash = hashlib.sha256(args.audio.read_bytes()).hexdigest()
    if result.get("status") != "model_output" or result.get("audio_sha256") != actual_hash:
        raise ValueError("Result does not match the supplied model-input WAV")
    if result.get("alignment", {}).get("error") is not None:
        raise ValueError(f"CTC alignment failed: {result['alignment']['error']}")
    words = result.get("words")
    if not isinstance(words, list) or not words:
        raise ValueError("Result has no aligned words")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(make_srt(words))
    print(f"Wrote {args.output} from {len(words)} aligned words")


if __name__ == "__main__":
    main()
