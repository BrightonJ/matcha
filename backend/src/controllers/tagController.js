const { user: userModel, tag: tagModel } = require('../models');

const getAllTags = async (req, res) => {
  try {
    const tags = await tagModel.getAll();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getMyTags = async (req, res) => {
  try {
    const tags = await tagModel.getUserTags(req.userId);
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const addTag = async (req, res) => {
  try {
    const { tagName } = req.body;
    
    if (!tagName) {
      return res.status(400).json({ error: 'tagName requis' });
    }
    
    const normalizedTagName = tagName.trim().toLowerCase();

    if (!/^[a-z0-9]+$/.test(normalizedTagName)) {
      return res.status(400).json({ error: 'Le tag ne doit contenir que des lettres et des chiffres, sans espace ni ponctuation.' });
    }
    
    let tag = await tagModel.findByName(normalizedTagName);
    if (!tag) {
      tag = await tagModel.create(normalizedTagName);
    }
    
    const result = await tagModel.addToUser(req.userId, tag.id);
    
    if (!result) {
      return res.status(400).json({ error: 'Tag déjà ajouté' });
    }
    
    res.json({ message: `Tag "${normalizedTagName}" ajouté avec succès` });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const removeTag = async (req, res) => {
  try {
    const { tagName } = req.params;
    
    if (!tagName) {
      return res.status(400).json({ error: 'tagName requis' });
    }
    
    const tag = await tagModel.findByName(tagName);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag non trouvé' });
    }
    
    const result = await tagModel.removeFromUser(req.userId, tag.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Tag non trouvé sur ce profil' });
    }
    
    res.json({ message: `Tag "${tagName}" supprimé avec succès` });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getUserTags = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const tags = await tagModel.getUserTags(userId);
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAllTags, getMyTags, addTag, removeTag, getUserTags };