#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Starting Kibana in DEV mode (Vault disabled)..."

# --- Lancer Kibana ---
exec "$@"
