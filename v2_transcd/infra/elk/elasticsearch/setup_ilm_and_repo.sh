#!/usr/bin/env bash
set -euo pipefail

ES_URL="${ES_URL:-http://elasticsearch:9200}"
ES_USER="${ES_USER:-elastic}"
ES_PASS="${ES_PASS:?Missing ES_PASS}"

echo "[setup] Waiting for Elasticsearch to be up at ${ES_URL}..."
for i in {1..60}; do
  if curl -s -u "${ES_USER}:${ES_PASS}" "${ES_URL}" >/dev/null; then
    break
  fi
  sleep 2
done

echo "[setup] Load ILM policy (logs-delete-after-14d)"
curl -sS -u "${ES_USER}:${ES_PASS}" -H 'Content-Type: application/json' -X PUT "${ES_URL}/_ilm/policy/logs-delete-after-14d" --data-binary @/usr/share/elasticsearch/config/ilm/logs-delete-after-14d.json | jq .

echo "[setup] Put index template (filebeat-template)"
curl -sS -u "${ES_USER}:${ES_PASS}" -H 'Content-Type: application/json' -X PUT "${ES_URL}/_index_template/filebeat-template" --data-binary @/usr/share/elasticsearch/config/templates/filebeat-template.json | jq .

echo "[setup] Register snapshot repository 'local_snapshots' (requires mounted /usr/share/elasticsearch/snapshots)"
curl -sS -u "${ES_USER}:${ES_PASS}" -H 'Content-Type: application/json' -X PUT "${ES_URL}/_snapshot/local_snapshots" --data-binary @/usr/share/elasticsearch/config/snapshot-repo.json | jq .

# --- Set kibana_system password so Kibana can log in ---
if [ -n "${KIBANA_PASSWORD}" ]; then
  for i in {1..20}; do
    code=$(curl -s -o /dev/null -w "%{http_code}" \
      -u "${ES_USER}:${ES_PASS}" \
      -H 'Content-Type: application/json' \
      -X POST "${ES_URL}/_security/user/kibana_system/_password" \
      -d "{\"password\":\"${KIBANA_PASSWORD}\"}")
    [ "$code" = "200" ] && echo "kibana_system ok" && break
    sleep 3
  done
fi

echo "[setup] Done."
