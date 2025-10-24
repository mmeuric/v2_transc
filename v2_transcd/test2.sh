#!/bin/bash

# ===============================================
# Script de tests pour l'infrastructure Transcendance
# ===============================================

set -e  # Arrête le script en cas d'erreur critique

echo "==============================================="
echo "✅ 1. Salut l'équipe"
echo "==============================================="

# Fonction utilitaire pour tester un endpoint HTTP avec retries
test_http() {
    local url=$1
    local name=$2
    local expected=${3:-200}
    local retries=${4:-3}   # Nombre de tentatives
    local wait_sec=${5:-3}  # Attente entre tentatives

    local attempt=1
    while [ $attempt -le $retries ]; do
        http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
        if [ "$http_code" -eq "$expected" ] || [[ "$url" == *"/metrics" ]] || [[ "$url" == *"/health" ]]; then
            echo "✔ $name répond correctement ($http_code) après $attempt tentative(s)"
            return 0
        else
            echo "⏳ $name non prêt (tentative $attempt/$retries, code $http_code)..."
            sleep $wait_sec
            attempt=$((attempt+1))
        fi
    done
    echo "❌ $name inaccessible après $retries tentatives (dernier code $http_code)"
    return 1
}

# -----------------------------
# 2. BACKEND Services
# -----------------------------
echo "✅ 2. Test des services backend"

test_http "http://localhost:4000/health" "Api-auth-user"
test_http "http://localhost:4001/health" "Gateway"
test_http "http://localhost:4002/health" "Game-Service"
test_http "http://localhost:3020/health" "API BDD"
test_http "http://localhost:3021/health" "API Blockchain"

echo "==============================================="

# -----------------------------
# 3. Frontend
# -----------------------------
echo "✅ 3. Test Frontend (React/Tailwind)"
test_http "http://localhost:3000" "Frontend"

echo "==============================================="

# -----------------------------
# 4. ELK stack
# -----------------------------
echo "✅ 4. Test ELK stack"

test_http "http://localhost:9200" "Elasticsearch"
# Logstash n'est pas HTTP, on teste le port avec retries
for attempt in {1..5}; do
    nc -z localhost 5044 && { echo "✔ Logstash répond (tentative $attempt)"; break; } || { echo "⏳ Logstash non prêt (tentative $attempt)"; sleep 3; }
done
test_http "http://localhost:5601" "Kibana"

echo "==============================================="

# -----------------------------
# 5. Monitoring
# -----------------------------
echo "✅ 5. Test monitoring"

test_http "http://localhost:9090/metrics" "Prometheus"
test_http "http://localhost:3010" "Grafana"
test_http "http://localhost:8082" "cAdvisor"
test_http "http://localhost:9100/metrics" "Node Exporter"

echo "==============================================="

# -----------------------------
# 6. Reverse proxy & sécurité
# -----------------------------
echo "✅ 6. Test Reverse Proxy + Nginx"
test_http "http://localhost" "Nginx"

echo "==============================================="

# -----------------------------
# 7. Vault
# -----------------------------
echo "✅ 7. Test Vault"
test_http "http://localhost:8200/v1/sys/health" "Vault"

echo "==============================================="
echo "✅ Tous les tests sont terminés !"
