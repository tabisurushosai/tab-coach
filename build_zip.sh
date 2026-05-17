#!/usr/bin/env bash
# build_zip.sh — package release/tab-coach.zip for Chrome Web Store upload.
# Bundles the Vite-built dist/ output plus the static manifest, _locales, and icons.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DIST_DIR="dist"
RELEASE_DIR="release"
STAGE_DIR="$RELEASE_DIR/_stage"
ZIP_NAME="tab-coach.zip"
ZIP_PATH="$RELEASE_DIR/$ZIP_NAME"

if [[ ! -d "$DIST_DIR" ]]; then
  echo "[build_zip] dist/ not found. Run 'npm run build' first." >&2
  exit 1
fi

for required in manifest.json _locales icons; do
  if [[ ! -e "$required" ]]; then
    echo "[build_zip] required path missing: $required" >&2
    exit 1
  fi
done

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

# Copy Vite build output (background/, popup/, options/, content/, assets/).
cp -R "$DIST_DIR"/. "$STAGE_DIR"/

# Copy static extension assets that Vite does not emit.
cp manifest.json "$STAGE_DIR"/manifest.json
cp -R _locales "$STAGE_DIR"/_locales
cp -R icons "$STAGE_DIR"/icons

# Strip sourcemaps so they are not shipped to end users.
find "$STAGE_DIR" -name '*.map' -type f -delete

rm -f "$ZIP_PATH"

(
  cd "$STAGE_DIR"
  # -r recursive, -q quiet, -X strip extra file attributes.
  zip -rqX "../$ZIP_NAME" .
)

rm -rf "$STAGE_DIR"

SIZE_BYTES=$(wc -c < "$ZIP_PATH" | tr -d ' ')
echo "[build_zip] wrote $ZIP_PATH ($SIZE_BYTES bytes)"
