# Run Nemotron 3.5 Transcribe on one Brev H100

This runbook records the working setup from 29 October 2026. It is a local draft for a later infrastructure guide. It uses NVIDIA's [Nemotron 3.5 Transcribe model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B), specifically the vLLM recipe with speaker tags and CTC word timestamps.

## Instance and access

- Brev organization: `nvaitc_workshop` (`org-3DNuLokQkaLYdhZcZMjwirIZu3V`).
- Instance: `nemotron-transcribe-v1`, Nebius `gpu-h100-sxm.1gpu-16vcpu-200gb` in `eu-north1` (Finland), 1 × H100 80 GB, 16 vCPUs, 200 GiB RAM, 256 GiB disk.
- Brev showed $5.44/hour running, including $0.04/hour storage; this instance can be stopped and restarted.
- Keep vLLM bound to `127.0.0.1:8000`. No public HTTP endpoint is needed.

Install the [official Brev CLI](https://docs.nvidia.com/brev/cli/getting-started) on a Linux workstation and authenticate. For this run, the installer was downloaded and inspected first, then installed to `/tmp/brev-cli-bin`:

```bash
curl -fsSL https://raw.githubusercontent.com/brevdev/brev-cli/main/bin/install-latest.sh -o /tmp/brev-install-latest.sh
BREV_INSTALL_DIR=/tmp/brev-cli-bin bash /tmp/brev-install-latest.sh
/tmp/brev-cli-bin/brev login --skip-browser
/tmp/brev-cli-bin/brev org set nvaitc_workshop
/tmp/brev-cli-bin/brev ls --all
export PATH="/tmp/brev-cli-bin:$PATH"
```

Open the URL printed by `login` in a browser already signed in to the same Brev account. Never save the login URL, its one-time code, or CLI credentials in the repository. The CLI created the SSH config and key. Connect with `brev shell nemotron-transcribe-v1`, or use `brev exec nemotron-transcribe-v1 "nvidia-smi"` for one command. A direct `ssh nemotron-transcribe-v1` also worked after CLI setup. The first `brev exec`/`brev copy` attempts waited briefly for SSH even though Brev showed the instance as running; they succeeded without instance changes.

## Install on the H100

The image had Ubuntu Python 3.12.3 and an NVIDIA driver reporting CUDA support. `python3 -m venv` initially failed because Ubuntu's `ensurepip` package was absent. The setup instead used the official `uv` installer:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
git clone https://github.com/NVIDIA-NeMo/Speech.git ~/nemo-speech
cd ~/nemo-speech
git rev-parse HEAD
uv venv --python 3.13 .venv
UV_PROJECT_ENVIRONMENT="$PWD/.venv" uv sync --extra asr --extra vllm --locked --no-install-project
uv pip install --python .venv/bin/python --no-deps -e .
uv pip install --python .venv/bin/python --no-deps av==19.0.2 opencv-python-headless==5.0.0.93
source .venv/bin/activate
python -c 'import sys, vllm; print(sys.version, vllm.__version__)'
hf download nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B --local-dir ./NVIDIA-Nemotron-3.5-Transcribe-30B-A4B
```

The actual `uv sync` recreated `.venv` with Python **3.12.3**, despite the preceding `uv venv --python 3.13`. The model then loaded under 3.12.3, but use `uv sync --python 3.13` if matching the model card's example is required for another run. The checked versions for this run were NeMo Speech commit `88846dcfa90233dce178cc3d5d9dd6065cdc8380`, vLLM `0.32.0`, and model revision `9d8cd6b79bfdd427b6558a5fdbf76fcaf8c75341`. The checkpoint was one 67,496,013,734-byte `model.safetensors` file (62.86 GiB), and the Hugging Face download took 10 minutes 27 seconds. No Hugging Face token was used.

The clone and `hf download` commands above used the repositories' then-current revisions. For a future repeat of this exact run, pin them explicitly before installation/download:

```bash
cd ~/nemo-speech
git checkout 88846dcfa90233dce178cc3d5d9dd6065cdc8380
hf download nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B \
  --revision 9d8cd6b79bfdd427b6558a5fdbf76fcaf8c75341 \
  --local-dir ./NVIDIA-Nemotron-3.5-Transcribe-30B-A4B
```

`scripts/setup_h100.sh` contains the commands used by this project. `brev exec nemotron-transcribe-v1 @scripts/setup_h100.sh` sent it to the instance. The Hugging Face CLI left a `.incomplete` file at the full size for several minutes before finalizing; the transfer completed normally, so do not rename a partial checkpoint just because its size matches the published size.

## Start the server and infer

Copy this repository's `scripts/serve_h100.sh`, `scripts/transcribe.py`, and `assets/demo_conversation.wav` to the instance. The recording is mono 16 kHz PCM WAV, synthesized locally from an original two-speaker script. Example:

```bash
brev exec nemotron-transcribe-v1 "mkdir -p /home/ubuntu/nemotron-demo"
brev copy scripts/serve_h100.sh nemotron-transcribe-v1:/home/ubuntu/nemotron-demo/serve_h100.sh
brev copy scripts/transcribe.py nemotron-transcribe-v1:/home/ubuntu/nemotron-demo/transcribe.py
brev copy assets/demo_conversation.wav nemotron-transcribe-v1:/home/ubuntu/nemotron-demo/demo_conversation.wav
```

On the instance:

```bash
cd ~/nemo-speech
source .venv/bin/activate
bash ~/nemotron-demo/serve_h100.sh "$PWD/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B"
```

The script follows NVIDIA's single-H100 BF16 vLLM command: V1 runner, ReplaySSM, MTP8, CTC timestamp middleware, and loopback host. Startup includes model loading, `torch.compile`, and kernel warmup. In another shell, check readiness and run inference:

```bash
curl -fsS http://127.0.0.1:8000/v1/models
python3 ~/nemotron-demo/transcribe.py ~/nemotron-demo/demo_conversation.wav \
  --output ~/nemotron-demo/demo_conversation.json
```

The request asks for punctuation, speaker tags, and word timestamps with `capture_ctc_timestamps=true`, temperature 0 and reasoning off. The script fails if CTC alignment reports an error or words are missing. Copy the JSON back to `runs/demo_conversation.json`, then run `scripts/finalize_run.py` to check the audio hash and produce the SRT, manifest, and Remotion props.

One local finalization sequence, from the repository root:

```bash
brev copy nemotron-transcribe-v1:/home/ubuntu/nemotron-demo/demo_conversation.json runs/demo_conversation.json
python3 scripts/finalize_run.py \
  --model-revision 9d8cd6b79bfdd427b6558a5fdbf76fcaf8c75341 \
  --speech-commit 88846dcfa90233dce178cc3d5d9dd6065cdc8380
python3 scripts/audit_run.py
cd video
npm ci
npm run typecheck
npm run render -- --props=./result.props.json
```

The first real request took 2.666 seconds for the 34.24-second input after the model had loaded and warmed up. It returned 90 aligned words, two speaker tags and `alignment.error=null`. These numbers describe this one synthetic recording and warm server request.

## Troubleshooting observed

1. **`python3 -m venv` → `ensurepip is not available`:** The Brev Ubuntu image lacked `python3.12-venv`. Use `uv` as above or install Ubuntu's matching venv package. The failed partial `~/nemotron-bootstrap` directory was not used further.
2. **vLLM startup → `fatal error: Python.h: No such file or directory`:** Triton tried to compile a CUDA helper against Python 3.12. Install `python3.12-dev` on the instance, then restart vLLM:

   ```bash
   sudo apt-get update -qq
   sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3.12-dev
   ```

3. **`/v1/models` refuses connections during startup:** Watch the vLLM log; model loading, torch compilation and warmup take time. A refused connection alone is not evidence of failure. Look for `ERROR`, `fatal error`, or `Application startup complete` before retrying.
4. **Brev lists `RUNNING` but initial SSH waits:** The CLI retried and connected after about 10–20 seconds in this run. Check `brev ls --all`, then `brev refresh` if the SSH configuration remains stale, as recommended by the [Brev CLI docs](https://docs.nvidia.com/brev/cli/connectivity).
5. **A Remotion still lost the model title late in scene 2:** The title container remained in the DOM with opacity 1, but Chromium omitted its text at frame 375. A near-transparent container background (`#FFFFFF01`) forced consistent compositing; stills at frames 330, 360 and 375 were checked before the final render. This affected only the video, not inference.

## Shutdown and cost control

After copying the real output and checking it locally, stop the instance:

```bash
brev stop nemotron-transcribe-v1
brev ls --all
```

Stopping retains the disk and incurs Brev's stated storage charge. Record the actual final status in the run log. Do not leave this H100 running for a local video render.

For this run, the first status check after `brev stop` showed `STOPPING`; a later `brev ls --all` showed **`STOPPED`**. The final video render ran locally after shutdown.
