#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Starting Elasticsearch entrypoint..."

if [ -n "${VAULT_ADDR:-}" ] && [ -n "${ES_VAULT_TOKEN:-}" ] && [ -n "${VAULT_SECRET_PATH:-}" ]; then
  echo "[entrypoint] Fetching ELASTIC_PASSWORD from Vault..."
  resp=$(curl -sS --fail --retry 3 \
    --header "X-Vault-Token: ${ES_VAULT_TOKEN}" \
    "${VAULT_ADDR}/v1/${VAULT_SECRET_PATH}")

  ELASTIC_PASSWORD=$(echo "$resp" | jq -r '.data.data.ELASTIC_PASSWORD // empty')

  if [ -z "$ELASTIC_PASSWORD" ]; then
    echo "[entrypoint][error] ELASTIC_PASSWORD not found in Vault!" >&2
    exit 1
  fi

  export ELASTIC_PASSWORD
  echo "[entrypoint] Password fetched from Vault."
else
  echo "[entrypoint] No Vault config detected → starting in dev mode."
fi

exec "$@"
