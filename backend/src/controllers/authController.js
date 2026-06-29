const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { user: userModel } = require('../models');
const pool = require('../db/pool');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
require('dotenv').config();

const validatePassword = (pwd) => {
  const forbiddenWords = ['password', 'coffee', 'love', '123456', 'azerty', 'qwerty'];
  const lowerPwd = pwd.toLowerCase();
  if (forbiddenWords.some(word => lowerPwd.includes(word))) return false;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
  return regex.test(pwd);
};

const register = async (req, res) => {
  try {
    const { email, username, firstName, lastName, password } = req.body;

    if (!email || !username || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Le mot de passe est trop faible ou contient un mot interdit.' });
    }

    const emailExists = await userModel.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const usernameExists = await userModel.usernameExists(username);
    if (usernameExists) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await userModel.createWithVerification({
      email,
      username,
      firstName,
      lastName,
      passwordHash,
      verificationToken,
      verificationExpires
    });

    await sendVerificationEmail(email, username, verificationToken);

    const { password_hash, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Inscription réussie ! Un email de vérification a été envoyé.',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const login = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Aucun champ fourni' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const user = await userModel.findByUsernameWithPassword(username);
    if (!user) {
      return res.status(401).json({ error: 'Nom d\'utilisateur inconnu' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    if (!user.is_verified) {
      return res.status(401).json({ error: 'Veuillez vérifier votre email avant de vous connecter' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Connexion réussie !',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await userModel.findByVerificationToken(token);
    
    if (!user) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }
    
    await userModel.verifyUser(user.id);
    
    res.json({ message: 'Email vérifié avec succès ! Tu peux maintenant te connecter.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000);

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    await sendPasswordResetEmail(user.email, user.username, resetToken);

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: 'Le mot de passe est trop faible.' });
    }

    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    const userId = result.rows[0].id;
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
      [passwordHash, userId]
    );

    res.json({ message: 'Mot de passe réinitialisé avec succès ! Tu peux te connecter.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { register, login, verifyEmail, forgotPassword, resetPassword };