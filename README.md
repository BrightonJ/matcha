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
- PostgreSQL (v14+)

## 🎯 Fonctionnalités principales

| Fonctionnalité | Description |
|----------------|-------------|
| Authentification | Inscription, connexion, vérification email |
| Profil | Bio, tags, photos (max 5), géolocalisation |
| Matching | Like / Unlike, détection de match |
| Chat | Messages en temps réel (Socket.io) |
| Notifications | Temps réel (like, match, message, visite) |
| Recherche | Filtres (âge, localisation, tags, popularité) |
| Suggestions | Algorithme intelligent de matching |
| Blocage | /api/auth/verify/:token | Vérification email |

## 👥 Auteur

Projet réalisé dans le cadre du cursus 42.

## 📄 Licence

MIT
