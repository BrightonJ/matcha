const { like } = require('../models');
const { getIo } = require('../socket');

// Liker un utilisateur
const addLike = async (req, res) => {
  try {
    const { userId } = req.params;
    const toUserId = parseInt(userId);
    
    if (isNaN(toUserId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    
    if (toUserId === req.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous liker vous-même' });
    }
    
    const io = getIo();
    const result = await like.add(req.userId, toUserId, io);
    
    if (result.isMatch) {
      res.json({ 
        message: '❤️ C\'est un match ! Vous pouvez maintenant discuter',
        match: true
      });
    } else {
      res.json({ 
        message: '👍 Like ajouté',
        match: false
      });
    }
  } catch (error) {
    console.error('Erreur:', error);
    
    if (error.code === 'USER_NOT_FOUND' || 
        error.code === 'NO_PROFILE_PHOTO' || 
        error.code === 'LIKE_ALREADY_EXISTS' ||
        error.code === 'BLOCKED') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Unlike (supprimer un like)
const removeLike = async (req, res) => {
  try {
    const { userId } = req.params;
    const toUserId = parseInt(userId);
    
    if (isNaN(toUserId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    
    const io = getIo();
    const removed = await like.remove(req.userId, toUserId, io);
    
    if (!removed) {
      return res.status(404).json({ error: 'Like non trouvé' });
    }
    
    res.json({ message: '👎 Like retiré' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Voir mes likes reçus
const getReceivedLikes = async (req, res) => {
  try {
    const likes = await like.getReceivedLikes(req.userId);
    res.json(likes);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Voir mes likes envoyés
const getSentLikes = async (req, res) => {
  try {
    const likes = await like.getSentLikes(req.userId);
    res.json(likes);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Voir mes matchs
const getMatches = async (req, res) => {
  try {
    const matches = await like.getMatches(req.userId);
    res.json(matches);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const checkLike = async (req, res) => {
  try {
    const { userId } = req.params;
    const toUserId = parseInt(userId);
    
    if (isNaN(toUserId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    
    const liked = await like.exists(req.userId, toUserId);
    const likesMe = await like.exists(toUserId, req.userId); // Vérifie si l'autre t'a liké
    
    res.json({ liked, likesMe });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { addLike, removeLike, getReceivedLikes, getSentLikes, getMatches, checkLike };
