# Brev H100 instance used for this demo

This project used `nemotron-transcribe-v1` in the `nvaitc_workshop` organization on 29 October 2026. The instance was used twice for real inference, then **verified STOPPED** with `brev ls --all` after all three results were copied locally. This records that day's observation; check Brev for the current status.

| Setting | Actual |
| --- | --- |
| Provider / type | Nebius `gpu-h100-sxm.1gpu-16vcpu-200gb` |
| GPU | 1 × H100 80 GB |
| CPU / RAM | 16 vCPUs / 200 GiB |
| Disk | 256 GiB |
| Region | `eu-north1` (Finland) |
| Brev price shown on 29 October 2026 | $5.40/hour compute + $0.04/hour storage while running; $0.04/hour storage while stopped |
| Stop/start | Supported, disk retained |
| Last observed status on 29 October 2026 | `STOPPED` |

This type matched NVIDIA's one-H100 BF16 recipe and could be stopped immediately after inference. The cheaper Hyperstack H100 option shown in the organization did not support stop/start.

The exact setup and shutdown commands are in [H100_RUNBOOK.md](H100_RUNBOOK.md). No card details, login codes, or SSH material are in this repository.
