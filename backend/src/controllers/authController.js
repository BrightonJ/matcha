const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { user: userModel } = require('../models');
require('dotenv').config();
const crypto = require('crypto');
const { sendVerificationEmail } = require('../services/emailService');

const register = async (req, res) => {
  try {
    const { email, username, firstName, lastName, password } = req.body;

    // Vérifier que tous les champs sont présents
    if (!email || !username || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'email existe déjà
    const emailExists = await userModel.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifier si le username existe déjà
    const usernameExists = await userModel.usernameExists(username);
    if (usernameExists) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Générer un token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Créer l'utilisateur AVEC le token de vérification
    const newUser = await userModel.createWithVerification({
      email,
      username,
      firstName,
      lastName,
      passwordHash,
      verificationToken,
      verificationExpires
    });

    // Envoyer l'email de vérification
    await sendVerificationEmail(email, username, verificationToken);

    // Ne pas renvoyer le mot de passe
    const { password_hash, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Inscription réussie ! Un email de vérification a été envoyé.',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const login = async (req, res) => {
  try {

    if (!req.body) {
      return res.status(400).json({ error: 'Aucun champ fourni' });
    }

    const { username, password } = req.body;

    // Vérifier que les champs sont présents
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    // Chercher l'utilisateur par username
    const user = await userModel.findByUsernameWithPassword(username);
    if (!user) {
      return res.status(401).json({ error: 'Nom d\'utilisateur inconu' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Vérifier si le compte est vérifié
    if (!user.is_verified) {
      return res.status(401).json({ error: 'Veuillez vérifier votre email avant de vous connecter' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Ne pas renvoyer le mot de passe
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Connexion réussie !',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Chercher l'utilisateur par token
    const user = await userModel.findByVerificationToken(token);
    
    if (!user) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }
    
    // Marquer l'utilisateur comme vérifié
    await userModel.verifyUser(user.id);
    
    res.json({ message: 'Email vérifié avec succès ! Tu peux maintenant te connecter.' });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { register, login, verifyEmail };
