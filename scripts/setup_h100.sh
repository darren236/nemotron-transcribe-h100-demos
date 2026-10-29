#!/usr/bin/env bash
# Run on the Brev H100. Matches NVIDIA's 29 Oct 2026 vLLM model-card recipe.
set -euo pipefail

cd "$HOME"
if [[ ! -x "$HOME/.local/bin/uv" ]]; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$PATH"

if [[ ! -d nemo-speech ]]; then
  git clone https://github.com/NVIDIA-NeMo/Speech.git nemo-speech
fi
cd nemo-speech
git rev-parse HEAD | tee "$HOME/nemotron-speech-commit.txt"
uv venv --python 3.13 .venv
UV_PROJECT_ENVIRONMENT="$PWD/.venv" uv sync --extra asr --extra vllm --locked --no-install-project
uv pip install --python .venv/bin/python --no-deps -e .
uv pip install --python .venv/bin/python --no-deps av==19.0.2 opencv-python-headless==5.0.0.93
source .venv/bin/activate
python -c 'import vllm; print("vLLM", vllm.__version__)'
hf download nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B --local-dir ./NVIDIA-Nemotron-3.5-Transcribe-30B-A4B
du -sh NVIDIA-Nemotron-3.5-Transcribe-30B-A4B
