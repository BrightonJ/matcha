const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { user: userModel, photo: photoModel } = require("../models");

// Middleware de gestion d'erreur multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Fichier trop gros (max 5MB)" });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({ error: 'Champ invalide. Utilisez "photo" comme nom de champ' });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error:
          "Une seule image à la fois. Veuillez envoyer les photos une par une.",
      });
    }
    return res.status(400).json({ error: `Erreur: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: `${err.message}` });
  }
  next();
};

// Upload d'une photo
const uploadPhoto = async (req, res) => {
  try {
    // Vérifier qu'un fichier a été envoyé
    if (!req.file) {
      return res.status(400).json({
        error: 'Aucun fichier uploadé. Le champ doit s\'appeler "photo"',
      });
    }

    // Vérifier le nombre de photos
    const photoCount = await photoModel.count(req.userId);
    if (photoCount >= 5) {
      return res.status(400).json({
        error:
          "Maximum 5 photos par utilisateur. Supprimez-en avant d'en ajouter.",
      });
    }

    // Construire l'URL de la photo
    const photoUrl = `/uploads/${req.file.filename}`;

    // Si c'est la première photo, elle devient photo de profil
    const isProfile = photoCount === 0;

    const photo = await photoModel.add(req.userId, photoUrl, isProfile);

    const message = isProfile
      ? "Photo uploadée avec succès et définie comme photo de profil"
      : "Photo uploadée avec succès";

    res.status(201).json({
      message: message,
      photo: photo,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'upload" });
  }
};

// Récupérer les photos d'un utilisateur
const getUserPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    // Vérifier si l'utilisateur existe
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const photos = await photoModel.getUserPhotos(userId);
    res.json(photos);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Récupérer mes photos
const getMyPhotos = async (req, res) => {
  try {
    const photos = await photoModel.getUserPhotos(req.userId);
    res.json(photos);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Définir la photo de profil
const setProfilePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const result = await photoModel.setProfile(req.userId, parseInt(photoId));

    if (!result) {
      return res.status(404).json({ error: "Photo non trouvée" });
    }

    res.json({ message: "Photo de profil mise à jour" });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Supprimer une photo
const deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const parsedId = parseInt(photoId);

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "ID de photo invalide" });
    }

    const deletedPhoto = await photoModel.delete(parsedId, req.userId);

    if (!deletedPhoto) {
      return res
        .status(404)
        .json({ error: "Photo non trouvée" });
    }

    const message = "Photo supprimée";

    res.json({ message });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
};

module.exports = {
  uploadPhoto,
  getUserPhotos,
  getMyPhotos,
  setProfilePhoto,
  deletePhoto,
  handleMulterError,
};
