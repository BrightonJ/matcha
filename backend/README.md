# Matcha - Backend

API backend pour une application de rencontre, développée dans le cadre du projet Matcha.

## 🚀 Technologies utilisées

- **Node.js** - Environnement d'exécution JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de données relationnelle
- **Socket.io** - Communications temps réel (chat et notifications)
- **JWT** - Authentification
- **bcrypt** - Hachage des mots de passe
- **Multer** - Upload de fichiers
- **Nodemailer** - Envoi d'emails

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- PostgreSQL (v14 ou supérieur)
- Compte Gmail (pour l'envoi d'emails)

## 🔧 Installation

### 1. Cloner le repository

```bash
git clone <your-repo-url>
cd backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Crée un fichier .env à la racine :

```env
PORT=3000

# Base de données (Docker)
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=postgres
DB_PORT=5432
DB_NAME=matcha

# JWT
JWT_SECRET=votre_secret_long_et_aleatoire
JWT_EXPIRES_IN=1h

# Email (Gmail)
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=mot_de_passe_application

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 4. Initialiser la base de données

```bash
npm run init-db
```

### 5. Démarrer le serveur

```bash
npm run dev
```

## 📁 Structure du projet

```text
backend/
├── src/
│   ├── controllers/      # Logique métier
│   ├── routes/           # Définition des endpoints
│   ├── models/           # Requêtes SQL
│   ├── middlewares/      # Authentification, upload
│   ├── services/         # Email, etc.
│   ├── socket/           # Socket.io
│   └── db/               # Connexion DB, scripts SQL
├── uploads/              # Photos uploadées
├── .env                  # Variables d'environnement
├── app.js                # Point d'entrée
└── package.json
```

## 📡 API Endpoints

### Authentification

| Méthode | Endpoint                | Description        |
| ------- | ----------------------- | ------------------ |
| POST    | /api/auth/register      | Inscription        |
| POST    | /api/auth/login         | Connexion          |
| GET     | /api/auth/verify/:token | Vérification email |

### Profil

| Méthode | Endpoint              | Description             |
| ------- | --------------------- | ----------------------- |
| GET     | /api/profile/me       | Mon profil              |
| PUT     | /api/profile/me       | Modifier mon profil     |
| GET     | /api/profile/:id      | Profil d'un utilisateur |
| GET     | /api/profile/visitors | Mes visiteurs           |

### Tags

| Méthode | Endpoint              | Description      |
| ------- | --------------------- | ---------------- |
| GET     | /api/tags             | Tous les tags    |
| GET     | /api/tags/me          | Mes tags         |
| POST    | /api/tags/me          | Ajouter un tag   |
| DELETE  | /api/tags/me/:tagName | Supprimer un tag |

### Photos

| Méthode | Endpoint                     | Description             |
| ------- | ---------------------------- | ----------------------- |
| POST    | /api/photos/upload           | Upload (1 photo)        |
| GET     | /api/photos/me               | Mes photos              |
| GET     | /api/photos/user/:id         | Photos d'un utilisateur |
| PUT     | /api/photos/profile/:photoId | Définir photo de profil |
| DELETE  | /api/photos/:photoId         | Supprimer une photo     |

### Localisation

| Méthode | Endpoint             | Description     |
| ------- | -------------------- | --------------- |
| GET     | /api/location/me     | Ma localisation |
| PUT     | /api/location/gps    | Position GPS    |
| PUT     | /api/location/manual | Ville/quartier  |
| DELETE  | /api/location/me     | Désactiver      |

### Recherche & Suggestions

| Méthode | Endpoint                | Description       |
| ------- | ----------------------- | ----------------- |
| GET     | /api/search             | Recherche avancée |
| GET     | /api/search/suggestions | Suggestions       |

### Likes & Matchs

| Méthode | Endpoint                 | Description   |
| ------- | ------------------------ | ------------- |
| POST    | /api/likes/:userId       | Liker         |
| DELETE  | /api/likes/:userId       | Unlike        |
| GET     | /api/likes/sent          | Likes envoyés |
| GET     | /api/likes/received      | Likes reçus   |
| GET     | /api/likes/matches       | Mes matchs    |
| GET     | /api/likes/check/:userId | Vérifier like |

### Messages

| Méthode | Endpoint                    | Description             |
| ------- | --------------------------- | ----------------------- |
| POST    | /api/messages/:toUserId     | Envoyer (HTTP)          |
| GET     | /api/messages/conversations | Liste des conversations |
| GET     | /api/messages/:userId       | Conversation            |
| GET     | /api/messages/unread        | Messages non lus        |

### Notifications

| Méthode | Endpoint                        | Description                |
| ------- | ------------------------------- | -------------------------- |
| GET     | /api/notifications              | Mes notifications          |
| GET     | /api/notifications/unread/count | Compteur non lues          |
| PUT     | /api/notifications/:id/read     | Marquer comme lue          |
| PUT     | /api/notifications/read-all     | Tout marquer               |
| DELETE  | /api/notifications/:id          | Supprimer une notification |

### Blocage

| Méthode | Endpoint                  | Description       |
| ------- | ------------------------- | ----------------- |
| POST    | /api/blocks/:userId       | Bloquer           |
| DELETE  | /api/blocks/:userId       | Débloquer         |
| GET     | /api/blocks/check/:userId | Vérifier blocage  |
| GET     | /api/blocks               | Liste des bloqués |

## 🔌 WebSocket (Socket.io)

### Connexion

```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "VOTRE_JWT_TOKEN" },
});
```

### Événements

| Événement    | Direction | Description                    |
| ------------ | --------- | ------------------------------ |
| send_message | Émission  | Envoyer un message             |
| new_message  | Réception | Recevoir un message            |
| notification | Réception | Recevoir une notification      |
| mark_read    | Émission  | Marquer comme lu               |
| user_status  | Émission  | Mise à jour du statut en ligne |

### Exemple d'envoi de message

```javascript
socket.emit("send_message", { toUserId: 2, content: "Salut !" }, (response) =>
  console.log(response),
);
```

## 🛠️ Scripts disponibles

| Événement       | Description                                       |
| --------------- | ------------------------------------------------- |
| npm run dev     | Démarrer en développement (nodemon)               |
| npm start       | Démarrer en production                            |
| npm run init-db | Réinitialiser la base de données                  |
| npm run seed    | Génération de 500 profils de test (randomuser.me) |

## 🌱 Génération des profils de test

Pour générer 500 profils de test :

```bash
npm run seed
```

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Authentification JWT
- Validation des entrées
- Protection contre les injections SQL
- Upload limité (5MB, formats image)
- Variables sensibles dans .env

## 📧 Email

Pour utiliser l'envoi d'emails avec Gmail :

1. Activer la double authentification sur ton compte Google
2. Générer un mot de passe d'application
3. Renseigner EMAIL_USER et EMAIL_PASSWORD dans .env
