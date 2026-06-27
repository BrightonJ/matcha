# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend
DOCKER_DIR = docker
COMPOSE_FILE = $(DOCKER_DIR)/docker-compose.yml

# Couleurs
GREEN = \033[0;32m
BLUE = \033[0;34m
RED = \033[0;31m
YELLOW = \033[0;33m
NC = \033[0m

# Cible par défaut
.DEFAULT_GOAL := help

# Aide
help:
	@echo "$(BLUE)Matcha - Commandes disponibles:$(NC)"
	@echo ""
	@echo "  $(GREEN)make run$(NC)           - 🚀 TOUT EN UN : Docker + install + init-db + seed + serveurs"
	@echo "  $(GREEN)make docker-up$(NC)     - 🐳 Démarrer PostgreSQL avec Docker"
	@echo "  $(GREEN)make docker-down$(NC)   - 🐳 Arrêter PostgreSQL"
	@echo "  $(GREEN)make docker-clean$(NC)  - 🐳 Supprimer les données PostgreSQL"
	@echo "  $(GREEN)make install$(NC)       - Installer les dépendances"
	@echo "  $(GREEN)make backend$(NC)       - Lancer le backend (port 3000)"
	@echo "  $(GREEN)make frontend$(NC)      - Lancer le frontend (port 5173)"
	@echo "  $(GREEN)make init-db$(NC)       - Initialiser la base de données"
	@echo "  $(GREEN)make seed$(NC)          - Générer 500 profils de test"
	@echo "  $(GREEN)make clean$(NC)         - Supprimer node_modules"
	@echo "  $(GREEN)make fclean$(NC)        - Supprimer node_modules + uploads + Docker"
	@echo "  $(GREEN)make re$(NC)            - Nettoyage complet + réinstallation + init-db + seed"
	@echo "  $(GREEN)make check$(NC)         - Vérifier les prérequis"
	@echo "  $(GREEN)make kill$(NC)          - Tuer les processus sur les ports 3000 et 5173"
	@echo ""

# Vérifier les prérequis
check:
	@echo "$(BLUE)🔍 Vérification des prérequis...$(NC)"
	@command -v node >/dev/null 2>&1 || (echo "$(RED)❌ Node.js non trouvé$(NC)" && exit 1)
	@command -v npm >/dev/null 2>&1 || (echo "$(RED)❌ npm non trouvé$(NC)" && exit 1)
	@command -v docker >/dev/null 2>&1 || (echo "$(YELLOW)⚠️  Docker non trouvé (optionnel)$(NC)")
	@echo "$(GREEN)✅ Prérequis vérifiés$(NC)"

# ==================== DOCKER ====================

# Démarrer PostgreSQL avec Docker
docker-up:
	@echo "$(BLUE)🐳 Démarrage de PostgreSQL avec Docker...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) up -d 2>/dev/null || true
	@sleep 10
	@echo "$(GREEN)✅ PostgreSQL démarré sur le port 5432$(NC)"
	@echo "$(YELLOW)💡 Utilisateur: postgres, Mot de passe: postgres$(NC)"

# Arrêter PostgreSQL avec Docker
docker-down:
	@echo "$(BLUE)🐳 Arrêt de PostgreSQL...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) down 2>/dev/null || true
	@echo "$(GREEN)✅ PostgreSQL arrêté$(NC)"

# Supprimer les données PostgreSQL
docker-clean:
	@echo "$(BLUE)🐳 Suppression des données PostgreSQL...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) down -v 2>/dev/null || true
	@echo "$(GREEN)✅ Données supprimées$(NC)"

# ==================== INSTALLATION ====================

# Installer les dépendances
install:
	@echo "$(BLUE)📦 Installation des dépendances...$(NC)"
	@cd $(BACKEND_DIR) && npm install
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ Dépendances installées$(NC)"

# Initialiser la base de données
init-db:
	@echo "$(BLUE)🗄️  Initialisation de la base de données...$(NC)"
	@cd $(BACKEND_DIR) && npm run init-db
	@echo "$(GREEN)✅ Base de données initialisée$(NC)"

# Générer les profils de test
seed:
	@echo "$(BLUE)🌱 Génération des profils de test...$(NC)"
	@cd $(BACKEND_DIR) && npm run seed
	@echo "$(GREEN)✅ 500 profils créés$(NC)"

# ==================== SERVEURS ====================

# Lancer le backend (seul)
backend:
	@echo "$(BLUE)🚀 Lancement du backend sur http://localhost:3000...$(NC)"
	@cd $(BACKEND_DIR) && npm run dev

# Lancer le frontend (seul)
frontend:
	@echo "$(BLUE)🚀 Lancement du frontend sur http://localhost:5173...$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev

# TOUT EN UN : docker-up + install + init-db + seed + backend + frontend
run: docker-up install init-db seed
	@echo "$(BLUE)🚀 Lancement du backend et du frontend en parallèle...$(NC)"
	@echo "$(YELLOW)⚠️ 2 fois Ctrl+C pour arrêter les deux$(NC)"
	@echo "$(GREEN)✅ Backend: http://localhost:3000$(NC)"
	@echo "$(GREEN)✅ Frontend: http://localhost:5173$(NC)"
	@echo "$(GREEN)✅ PostgreSQL: localhost:5432 (user: postgres, password: postgres)$(NC)"
	@trap 'kill 0' EXIT; \
	(cd $(BACKEND_DIR) && npm run dev) & \
	(cd $(FRONTEND_DIR) && npm run dev) & \
	wait

# ==================== NETTOYAGE ====================

# Nettoyer les dépendances
clean:
	@echo "$(BLUE)🧹 Nettoyage...$(NC)"
	@rm -rf $(BACKEND_DIR)/node_modules
	@rm -rf $(FRONTEND_DIR)/node_modules
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

# Nettoyage complet (y compris uploads ET Docker)
fclean: clean docker-down
	@echo "$(BLUE)🧹 Suppression des uploads...$(NC)"
	@rm -rf $(BACKEND_DIR)/uploads
	@echo "$(GREEN)✅ Nettoyage complet terminé$(NC)"

# Rebuild complet (nettoyage + réinstallation + init-db + seed)
re: fclean install init-db seed
	@echo "$(GREEN)✅ Rebuild complet terminé$(NC)"
	@echo "$(YELLOW)💡 Lance 'make run' pour démarrer les serveurs$(NC)"

# ==================== UTILITAIRES ====================

# Tuer les processus sur les ports 3000 et 5173
kill:
	@echo "$(BLUE)🔪 Arrêt des processus sur les ports 3000 et 5173...$(NC)"
	@lsof -ti :3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti :5173 | xargs kill -9 2>/dev/null || true
	@echo "$(GREEN)✅ Ports libérés$(NC)"

.PHONY: help check docker-up docker-down docker-clean install init-db seed backend frontend run clean fclean re kill