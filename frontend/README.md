# Matcha - Frontend

Application frontend pour Matcha, une plateforme de rencontre. Développée avec React, Vite et Socket.io.

## 🚀 Technologies utilisées

- **React 19** - Bibliothèque UI
- **Vite** - Build tool
- **React Router DOM** - Navigation
- **Socket.io-client** - Chat et notifications temps réel
- **CSS Modules** - Styles

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- Backend Matcha en cours d'exécution (port 3000)

## 🔧 Installation

### 1. Cloner le repository

```bash
git clone <your-repo-url>
cd frontend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Crée un fichier .env à la racine :
```env
VITE_API_URL=http://localhost:3000/API
```

### 4. Démarrer l'application

```bash
npm run dev
```

## 📁 Structure du projet

```text
frontend/
├── src/
│   ├── assets/
│   │   └── css/           # Styles globaux et composants
│   ├── components/        # Composants réutilisables
│   │   ├── Avatar.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── UserCard.jsx
│   ├── context/           # Contextes React
│   │   ├── AuthContext.jsx
│   │   ├── NotificationContext.jsx
│   │   └── SocketContext.jsx
│   ├── layouts/           # Layout principal
│   │   └── MainLayout.jsx
│   ├── pages/             # Pages de l'application
│   │   ├── Login.jsx
│   │   ├── Search.jsx
│   │   ├── Profile.jsx
│   │   ├── PublicProfile.jsx
│   │   └── Chat.jsx
│   ├── utils/             # Utilitaires
│   │   └── age.js
│   ├── config/            # Configuration
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env
├── index.html
├── package.json
└── vite.config.js
```

## 🎯 Fonctionnalités

| Page       | Description |
|------------|-------------|
| /login | Connexion et inscriptionInscription |
| /search | Recherche et suggestions de profils |
| /profile | Gestion de son profil (bio, tags, photos) |
| /profile/:id | Consultation de profil public |
| /chat | Messagerie en temps réel |

## 🔌 WebSocket

L'application utilise Socket.io pour :

- Messages instantanés
- Notifications temps réel
- Statut en ligne des utilisateurs

```javascript
// Connexion automatique via le contexte SocketContext
const socket = useSocket();
```

## 📱 Responsive

L'interface est adaptée aux :

- Ordinateurs de bureau (≥ 1440px)
- Tablettes (768px - 1440px)
- Mobiles (< 768px)

## 🔐 Authentification

- Stockage du token JWT dans localStorage
- Header Authorization: Bearer <token> pour les requêtes API
- Redirection automatique vers /login si non authentifié