# Matcha

Application de rencontre permettant aux utilisateurs de créer un profil, liker d'autres personnes, matcher et discuter en temps réel.

## 🚀 Technologies

### Backend

- Node.js / Express
- PostgreSQL
- Socket.io
- JWT / bcrypt

### Frontend

- React / Vite
- Socket.io-client
- React Router DOM

## 📋 Prérequis

- Node.js (v18+)
- Docker & Docker Compose
- Make

## 🔧 Installation et lancement

```bash
make run
```

Cette commande va :

1. Démarrer PostgreSQL avec Docker
2. Installer les dépendances (backend + frontend)
3. Initialiser la base de données (création des tables)
4. Générer 500 profils de test (photos randomuser.me)
5. Lancer le backend (port 3000) et le frontend (port 5173) en parallèle

## 🛠️ Les pricipales commandes Makefile

| Fonctionnalité | Description                                               |
| -------------- | --------------------------------------------------------- |
| make run       | Docker + install + init-db + seed + serveurs              |
| make fclean    | Supprime node_modules + uploads + arrête/supprime Dockern |

## 📁 Structure du projet

```text
Matcha/
├── backend/          # API REST + WebSocket
├── frontend/         # Application React
├── docker/           # Docker Compose pour PostgreSQL
│   └── docker-compose.yml
├── Makefile          # Commandes automatisées
└── README.md
```

## 🎯 Fonctionnalités principales

| Fonctionnalité   | Description                                   |
| ---------------- | --------------------------------------------- |
| Authentification | Inscription, connexion, vérification email    |
| Profil           | Bio, tags, photos (max 5), géolocalisation    |
| Matching         | Like / Unlike, détection de match             |
| Chat             | Messages en temps réel (Socket.io)            |
| Notifications    | Temps réel (like, match, message, visite)     |
| Recherche        | Filtres (âge, localisation, tags, popularité) |
| Suggestions      | Algorithme intelligent de matching            |
| Blocage          | Bloquer / signaler un utilisateur             |

## 👥 Auteur

Brighton Joves ([@BrightonJ](https://github.com/BrightonJ))  
José Ralph ([@42yasuke](https://github.com/42yasuke))  
_Projet réalisé dans le cadre du cursus 42._

## 📄 Licence

MIT
