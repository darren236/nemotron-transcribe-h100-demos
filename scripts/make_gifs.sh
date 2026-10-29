#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FFMPEG_BIN="${FFMPEG_BIN:-$REPO_DIR/video/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg}"
OUT_DIR="$REPO_DIR/docs/gifs"
mkdir -p "$OUT_DIR"

render_gif() {
  local input="$1" start="$2" output="$3"
  "$FFMPEG_BIN" -y -loglevel error -ss "$start" -t 4 -i "$REPO_DIR/video/out/$input" \
    -filter_complex 'scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=bayer:bayer_scale=5' \
    -r 8 -loop 0 "$OUT_DIR/$output"
}

render_gif conversation-caption.mp4 5 conversation.gif
render_gif jfk-caption.mp4 3 jfk.gif
render_gif artemis-caption.mp4 0.4 artemis.gif

printf 'GIF previews written to %s\n' "$OUT_DIR"
