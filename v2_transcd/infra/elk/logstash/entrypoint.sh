#!/usr/bin/env bash
set -e

echo "[entrypoint] Starting Logstash..."
exec /usr/share/logstash/bin/logstash \
  -f /usr/share/logstash/pipeline/logstash.conf \
  --path.settings /usr/share/logstash/config \
  --http.host 0.0.0.0 \
  --http.port 9600
