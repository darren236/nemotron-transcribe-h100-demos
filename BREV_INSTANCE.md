# Brev H100 instance used for this demo

Darren created `nemotron-transcribe-v1` (ID `2qvehqt69`) in the `nvaitc_workshop` organization (`org-3DNuLokQkaLYdhZcZMjwirIZu3V`) on 29 October 2026. He authorized its automatic use for this project. The instance was started, used for inference, and **verified STOPPED** with `brev ls --all` after the result was copied locally. No idle H100 is currently running for this project.

| Setting | Actual |
| --- | --- |
| Provider / type | Nebius `gpu-h100-sxm.1gpu-16vcpu-200gb` |
| GPU | 1 × H100 80 GB |
| CPU / RAM | 16 vCPUs / 200 GiB |
| Disk | 256 GiB |
| Region | `eu-north1` (Finland) |
| Brev price shown | $5.40/hour compute + $0.04/hour storage while running; $0.04/hour storage while stopped |
| Stop/start | Supported, disk retained |
| Last observed status | `STOPPED` |

This type matched NVIDIA's one-H100 BF16 recipe and could be stopped immediately after inference. The cheaper Hyperstack H100 option shown in the org did not support stop/start. Historical approval-review blocks on a proposed Deploy action are superseded by Darren's subsequent creation and authorization of this instance.

The exact setup and shutdown commands are in [docs/H100_RUNBOOK.md](docs/H100_RUNBOOK.md). No card details, login codes, or SSH material are in this repository.
