#!/usr/bin/env bash
# chrome_publish.sh — Chrome Web Store publish helper for tab-coach.
#
# Usage:
#   bash chrome_publish.sh tab-coach upload          # upload release/tab-coach.zip to the existing item (draft).
#   bash chrome_publish.sh tab-coach publish         # publish the current draft to all users (after upload).
#   bash chrome_publish.sh tab-coach upload-and-publish
#   bash chrome_publish.sh tab-coach status          # show current item status.
#
# Required environment variables (load via direnv / .envrc / shell rc — never commit):
#   CWS_CLIENT_ID       Google OAuth2 client_id for an installed application.
#   CWS_CLIENT_SECRET   Google OAuth2 client_secret.
#   CWS_REFRESH_TOKEN   OAuth2 refresh_token with scope https://www.googleapis.com/auth/chromewebstore .
#   CWS_APP_ID          Chrome Web Store item ID (32-char). Only available AFTER the first manual upload via Console.
#
# Notes:
#   - v1.0.0 (initial release) MUST be uploaded manually via the Developer Console because no item ID exists yet.
#     See docs/release_final.md §4 and docs/store_listing.md §5.2 for the manual procedure.
#   - This script is the supported path for v1.0.1+ updates.
#   - Completely offline-extension policy: this script intentionally never embeds credentials.
#     Operator (社長 or 秘書) supplies them via environment variables at invocation time.
#   - No third-party tooling is required beyond bash + curl + jq + unzip.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

readonly ZIP_PATH="release/tab-coach.zip"
readonly OAUTH_TOKEN_URL="https://oauth2.googleapis.com/token"
readonly CWS_BASE_URL="https://www.googleapis.com/chromewebstore/v1.1/items"
readonly CWS_UPLOAD_URL="https://www.googleapis.com/upload/chromewebstore/v1.1/items"

log() { printf '[chrome_publish] %s\n' "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    die "required environment variable missing: $name"
  fi
}

require_target_app() {
  local target="$1"
  if [[ "$target" != "tab-coach" ]]; then
    die "unknown target: $target (only 'tab-coach' is supported in this repository)"
  fi
}

require_zip() {
  if [[ ! -f "$ZIP_PATH" ]]; then
    die "$ZIP_PATH not found. Run 'npm run build && bash build_zip.sh' first."
  fi

  # Defensive sanity: verify the manifest version inside the zip matches package.json.
  local pkg_version manifest_version
  pkg_version=$(jq -r '.version' package.json)
  manifest_version=$(unzip -p "$ZIP_PATH" manifest.json | jq -r '.version')
  if [[ "$pkg_version" != "$manifest_version" ]]; then
    die "version mismatch: package.json=$pkg_version vs manifest in zip=$manifest_version. Rebuild before publishing."
  fi
  log "verified zip: version=$manifest_version size=$(wc -c <"$ZIP_PATH" | tr -d ' ') bytes"
}

fetch_access_token() {
  require_env CWS_CLIENT_ID
  require_env CWS_CLIENT_SECRET
  require_env CWS_REFRESH_TOKEN

  local response
  response=$(curl --silent --show-error --fail \
    --request POST \
    --data-urlencode "client_id=${CWS_CLIENT_ID}" \
    --data-urlencode "client_secret=${CWS_CLIENT_SECRET}" \
    --data-urlencode "refresh_token=${CWS_REFRESH_TOKEN}" \
    --data-urlencode "grant_type=refresh_token" \
    "$OAUTH_TOKEN_URL")

  local token
  token=$(jq -r '.access_token // empty' <<<"$response")
  if [[ -z "$token" ]]; then
    die "failed to obtain access_token. Response: $response"
  fi
  printf '%s' "$token"
}

cmd_upload() {
  require_env CWS_APP_ID
  require_zip

  local token
  token=$(fetch_access_token)

  log "uploading $ZIP_PATH to item $CWS_APP_ID ..."
  local response
  response=$(curl --silent --show-error --fail \
    --request PUT \
    --header "Authorization: Bearer $token" \
    --header "x-goog-api-version: 2" \
    --upload-file "$ZIP_PATH" \
    "$CWS_UPLOAD_URL/$CWS_APP_ID")

  local state
  state=$(jq -r '.uploadState // empty' <<<"$response")
  case "$state" in
    SUCCESS)
      log "upload success: $(jq -c '.' <<<"$response")"
      ;;
    IN_PROGRESS)
      log "upload state IN_PROGRESS — re-run 'status' to confirm."
      ;;
    *)
      die "upload failed (state=$state). Full response: $response"
      ;;
  esac
}

cmd_publish() {
  require_env CWS_APP_ID

  local token
  token=$(fetch_access_token)

  # publishTarget=default publishes to all users. Use trustedTesters to restrict to the tester group.
  local target="${CWS_PUBLISH_TARGET:-default}"
  log "publishing item $CWS_APP_ID (target=$target) ..."

  local response
  response=$(curl --silent --show-error --fail \
    --request POST \
    --header "Authorization: Bearer $token" \
    --header "x-goog-api-version: 2" \
    --header "Content-Length: 0" \
    "$CWS_BASE_URL/$CWS_APP_ID/publish?publishTarget=$target")

  local statuses
  statuses=$(jq -r '.status[]? // empty' <<<"$response")
  log "publish response statuses: ${statuses:-<none>}"
  log "full response: $(jq -c '.' <<<"$response")"

  # OK / ITEM_PENDING_REVIEW are both acceptable success states.
  if grep -qE '^(OK|ITEM_PENDING_REVIEW)$' <<<"$statuses"; then
    log "publish accepted by Chrome Web Store. Track review status via 'status' subcommand or the Developer Console."
  else
    die "publish failed. See response above."
  fi
}

cmd_status() {
  require_env CWS_APP_ID

  local token
  token=$(fetch_access_token)

  log "fetching status for item $CWS_APP_ID ..."
  local response
  response=$(curl --silent --show-error --fail \
    --request GET \
    --header "Authorization: Bearer $token" \
    --header "x-goog-api-version: 2" \
    "$CWS_BASE_URL/$CWS_APP_ID?projection=DRAFT")

  jq '{itemId: .id, uploadState: .uploadState, crxVersion: .crxVersion, publicKey: (.publicKey // null) }' <<<"$response"
}

main() {
  require_cmd curl
  require_cmd jq
  require_cmd unzip

  local target="${1:-}"
  local action="${2:-}"

  if [[ -z "$target" || -z "$action" ]]; then
    cat >&2 <<'USAGE'
Usage: chrome_publish.sh <target> <action>
  target:  tab-coach
  action:  upload | publish | upload-and-publish | status

Environment:
  CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN, CWS_APP_ID  (all required)
  CWS_PUBLISH_TARGET   optional, "default" (all users) or "trustedTesters"

First release (v1.0.0): upload manually via Developer Console — see docs/release_final.md §4.
USAGE
    exit 64
  fi

  require_target_app "$target"

  case "$action" in
    upload)              cmd_upload ;;
    publish)             cmd_publish ;;
    upload-and-publish)  cmd_upload; cmd_publish ;;
    status)              cmd_status ;;
    *) die "unknown action: $action (expected upload|publish|upload-and-publish|status)" ;;
  esac
}

main "$@"
