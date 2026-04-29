const { user: userModel, tag: tagModel } = require('../models');

// Récupérer tous les tags disponibles
const getAllTags = async (req, res) => {
  try {
    const tags = await tagModel.getAll();
    res.json(tags);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les tags de l'utilisateur
const getMyTags = async (req, res) => {
  try {
    const tags = await tagModel.getUserTags(req.userId);
    res.json(tags);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Ajouter un tag à l'utilisateur
const addTag = async (req, res) => {
  try {
    const { tagName } = req.body;
    
    if (!tagName) {
      return res.status(400).json({ error: 'tagName requis' });
    }
    
    // Chercher le tag par son nom
    const tag = await tagModel.findByName(tagName);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag non trouvé' });
    }
    
    const result = await tagModel.addToUser(req.userId, tag.id);  // ← corrigé
    
    if (!result) {
      return res.status(400).json({ error: 'Tag déjà ajouté' });
    }
    
    res.json({ message: `Tag "${tagName}" ajouté avec succès` });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer un tag de l'utilisateur
const removeTag = async (req, res) => {
  try {
    const { tagName } = req.params;
    
    if (!tagName) {
      return res.status(400).json({ error: 'tagName requis' });
    }
    
    // Chercher le tag par son nom
    const tag = await tagModel.findByName(tagName);  // ← mieux
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag non trouvé' });
    }
    
    const result = await tagModel.removeFromUser(req.userId, tag.id);  // ← corrigé
    
    if (!result) {
      return res.status(404).json({ error: 'Tag non trouvé sur ce profil' });
    }
    
    res.json({ message: `Tag "${tagName}" supprimé avec succès` });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les tags d'un autre utilisateur
const getUserTags = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const tags = await tagModel.getUserTags(userId);
    res.json(tags);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAllTags, getMyTags, addTag, removeTag, getUserTags };