COMPOSE_FILE := docker-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)

MONITORING_FILE ?= infra/monitoring/docker-compose.monitoring.yml
COMPOSE_MONITORING := docker compose -f $(COMPOSE_FILE) -f $(MONITORING_FILE)

# Groupes de services
MON_STACK := prometheus grafana alertmanager blackbox cadvisor node-exporter
ELK_STACK := elasticsearch kibana logstash filebeat

# 👉 Liste des services "app" UNIQUEMENT (sans ELK, sans monitoring)
APP_STACK := auth-service game-service gateway api_bdd api_bc frontend nginx

all: build up

# ------------------------------
# Docker Compose build & run (app only)
# ------------------------------
build:
	@echo "🐳 Build des images APP uniquement ($(APP_STACK))"
	@$(COMPOSE) build $(APP_STACK)

up:
	@echo "🚀 Lancement des services APP uniquement..."
	@$(COMPOSE) up -d $(APP_STACK)

# (Optionnel) down qui ne touche que l'app
down:
	@echo "🛑 Arrêt + suppression des containers APP uniquement..."
	@$(COMPOSE) stop $(APP_STACK) || true
	@$(COMPOSE) rm -f -v $(APP_STACK) || true

re: fclean all
	
.PHONY: all build up down cleanBDD fclean re


# ======================================================================
# Lancer & supprimer (APP_STACK + MON_STACK) uniquement
# Lancer & supprimer (APP_STACK + ELK_STACK) uniquement
# ======================================================================

# --- APP + MONITORING (sans ELK) ---
.PHONY: up-app-monitoring rm-app-monitoring
up-app-monitoring:
	@echo "🚀 Lancement APP + MONITORING ($(APP_STACK) + $(MON_STACK))..."
	@$(COMPOSE_MONITORING) up -d --build $(APP_STACK) $(MON_STACK)
	@echo "✅ APP + MONITORING démarrés."

rm-app-monitoring:
	@echo "🛑 Arrêt + suppression APP + MONITORING ($(APP_STACK) + $(MON_STACK))..."
	@$(COMPOSE_MONITORING) stop $(APP_STACK) $(MON_STACK) || true
	@$(COMPOSE_MONITORING) rm -f -v $(APP_STACK) $(MON_STACK) || true
	@echo "✅ APP + MONITORING supprimés."

# --- APP + ELK (sans MONITORING) ---
.PHONY: up-app-elk rm-app-elk
up-app-elk:
	@echo "🚀 Lancement APP + ELK ($(APP_STACK) + $(ELK_STACK))..."
	@$(COMPOSE) up -d --build $(APP_STACK) $(ELK_STACK)
	@echo "✅ APP + ELK démarrés."

rm-app-elk:
	@echo "🛑 Arrêt + suppression APP + ELK ($(APP_STACK) + $(ELK_STACK))..."
	@$(COMPOSE) stop $(APP_STACK) $(ELK_STACK) || true
	@$(COMPOSE) rm -f -v $(APP_STACK) $(ELK_STACK) || true
	@echo "✅ APP + ELK supprimés."