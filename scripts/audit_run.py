#!/usr/bin/env python3
"""Compare the model result against this demo's original synthetic source script."""

import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]


def tokens(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+(?:'[a-z0-9]+)?", text.lower())


def main() -> None:
    source = json.loads((ROOT / "assets/demo_conversation_script.json").read_text())
    result = json.loads((ROOT / "runs/demo_conversation.json").read_text())
    reference = [token for line in source["lines"] for token in tokens(line["text"])]
    output = [token for word in result["words"] for token in tokens(word["word"])]
    turns = []
    for word in result["words"]:
        if not turns or turns[-1]["speaker"] != word["speaker"]:
            turns.append({"speaker": word["speaker"], "start": word["start"], "end": word["end"]})
        else:
            turns[-1]["end"] = word["end"]
    report = {
        "scope": "Single locally synthesized recording; this is a reproducibility check, not a model benchmark.",
        "reference_token_count": len(reference),
        "model_token_count": len(output),
        "normalized_tokens_match_reference": reference == output,
        "reference_turn_count": len(source["lines"]),
        "model_turn_count": len(turns),
        "alternating_speakers_match_reference": len(turns) == len(source["lines"]) and
            all(turns[i]["speaker"] == turns[i % 2]["speaker"] for i in range(len(turns))) and
            len({turn["speaker"] for turn in turns}) == 2,
        "turns": [
            {
                "model_speaker": turn["speaker"],
                "model_start": turn["start"],
                "model_end": turn["end"],
                "source_start": source["lines"][i]["start"],
                "source_end": source["lines"][i]["end"],
            }
            for i, turn in enumerate(turns[:len(source["lines"])])
        ],
    }
    (ROOT / "runs/audit.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "turns"}, indent=2))


if __name__ == "__main__":
    main()
