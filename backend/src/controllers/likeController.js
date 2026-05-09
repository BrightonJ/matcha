const { like } = require("../models");
const { block: blockModel } = require("../models");

// Liker un utilisateur
const addLike = async (req, res) => {
  try {
    const { userId } = req.params;
    const toUserId = parseInt(userId);

    if (isNaN(toUserId)) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    if (toUserId === req.userId) {
      return res
        .status(400)
        .json({ error: "Vous ne pouvez pas vous liker vous-même" });
    }

    // Vérifier si l'un des deux a bloqué l'autre
    const blockedHim = await blockModel.isBlocked(req.userId, toUserId);
    const blockedByHim = await blockModel.isBlocked(toUserId, req.userId);

    if (blockedHim || blockedByHim) {
      return res.status(403).json({ error: "Vous ne pouvez pas liker ce profil" });
    }

    const result = await like.add(req.userId, toUserId);

    if (result.isMatch) {
      res.json({
        message: "C'est un match ! Vous pouvez maintenant discuter",
        match: true,
      });
    } else {
      res.json({
        message: "Like ajouté",
        match: false,
      });
    }
  } catch (error) {
    console.error("Erreur:", error);

    // Gestion des erreurs client (400)
    if (error.code === "USER_NOT_FOUND") {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === "NO_PROFILE_PHOTO") {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === "LIKE_ALREADY_EXISTS") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Utilisateur cible inexistant") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Vous devez avoir une photo de profil pour liker") {
      return res.status(400).json({ error: error.message });
    }

    // Erreur serveur (500)
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Unlike (supprimer un like)
const removeLike = async (req, res) => {
  try {
    const { userId } = req.params;
    const toUserId = parseInt(userId);

    if (isNaN(toUserId)) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const removed = await like.remove(req.userId, toUserId);

    if (!removed) {
      return res.status(404).json({ error: "Like non trouvé" });
    }

    res.json({ message: "Like retiré" });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Voir mes likes reçus
const getReceivedLikes = async (req, res) => {
  try {
    const likes = await like.getReceivedLikes(req.userId);
    res.json(likes);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Voir mes likes envoyés
const getSentLikes = async (req, res) => {
  try {
    const likes = await like.getSentLikes(req.userId);
    res.json(likes);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Voir mes matchs
const getMatches = async (req, res) => {
  try {
    const matches = await like.getMatches(req.userId);
    res.json(matches);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Vérifier si j'ai liké un utilisateur
const checkLike = async (req, res) => {
  try {
    const { userId } = req.params;
    const toUserId = parseInt(userId);

    if (isNaN(toUserId)) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const exists = await like.exists(req.userId, toUserId);
    res.json({ liked: exists });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = {
  addLike,
  removeLike,
  getReceivedLikes,
  getSentLikes,
  getMatches,
  checkLike,
};
