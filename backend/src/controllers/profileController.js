const { user: userModel, visit: visitModel, notification: notificationModel } = require("../models");

// Récupérer son propre profil
const getMyProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Ne pas renvoyer le mot de passe
    const { password_hash, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Récupérer le profil d'un autre utilisateur
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Enregistrer la visite
    await visitModel.add(req.userId, userId);

    // Créer une notification de visite
    const visitor = await userModel.findById(req.userId);
    const notification = await notificationModel.create(
      userId, // visited_id
      "visit",
      req.userId, // visitor_id
      `${visitor.username} a consulté votre profil`,
      { visited: true },
    );

    const io = global.io;
    if (!io) {
      throw new Error("Socket.io not initialized");
    }
    io.to(`user:${userId}`).emit("notification", notification);

    // Ne pas renvoyer le mot de passe
    const { password_hash, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Voir mes visiteurs
const getMyVisitors = async (req, res) => {
  try {
    const visitors = await visitModel.getMyVisitors(req.userId);
    res.json(visitors);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Modifier son profil
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      "firstName",
      "lastName",
      "email",
      "bio",
      "gender",
      "sexualPreferences",
      "locationCity",
    ];
    const updates = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        const dbField = field.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`,
        );
        updates[dbField] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (updates.email) {
      const existingUser = await userModel.findByEmail(updates.email);
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ error: "Cet email est déjà utilisé" });
      }
    }

    const updatedUser = await userModel.updateProfile(req.userId, updates);

    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({
      message: "Profil mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = { getMyProfile, getUserProfile, updateProfile, getMyVisitors };
