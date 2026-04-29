const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Vérification de l'email
router.get('/verify/:token', authController.verifyEmail);

// Enregistrement d'un nouvel utilisateur
router.post('/register', authController.register);

// Connexion d'un utilisateur existant
router.post('/login', authController.login);

module.exports = router;