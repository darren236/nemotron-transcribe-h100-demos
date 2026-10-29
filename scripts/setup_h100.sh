#!/usr/bin/env bash
# Run on an Ubuntu H100. Pin the revisions used for the saved demos.
set -euo pipefail

SPEECH_COMMIT=88846dcfa90233dce178cc3d5d9dd6065cdc8380
MODEL_REVISION=9d8cd6b79bfdd427b6558a5fdbf76fcaf8c75341

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git curl python3.12-dev ffmpeg

cd "$HOME"
if [[ ! -x "$HOME/.local/bin/uv" ]]; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$PATH"

if [[ ! -d nemo-speech ]]; then
  git clone https://github.com/NVIDIA-NeMo/Speech.git nemo-speech
fi
cd nemo-speech
git checkout --detach "$SPEECH_COMMIT"
git rev-parse HEAD | tee "$HOME/nemotron-speech-commit.txt"
UV_PROJECT_ENVIRONMENT="$PWD/.venv" uv sync --python 3.12 --extra asr --extra vllm --locked --no-install-project
uv pip install --python .venv/bin/python --no-deps -e .
uv pip install --python .venv/bin/python --no-deps av==19.0.2 opencv-python-headless==5.0.0.93
source .venv/bin/activate
python -c 'import vllm; print("vLLM", vllm.__version__)'
hf download nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B \
  --revision "$MODEL_REVISION" \
  --local-dir ./NVIDIA-Nemotron-3.5-Transcribe-30B-A4B
du -sh NVIDIA-Nemotron-3.5-Transcribe-30B-A4B
