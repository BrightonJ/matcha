const { block } = require('../models');

// Bloquer un utilisateur
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const blockedId = parseInt(userId);
    
    if (isNaN(blockedId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    
    if (blockedId === req.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous bloquer vous-même' });
    }
    
    const result = await block.add(req.userId, blockedId);
    
    if (!result) {
      return res.status(400).json({ error: 'Utilisateur déjà bloqué' });
    }
    
    res.json({ message: 'Utilisateur bloqué avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Débloquer un utilisateur
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const blockedId = parseInt(userId);
    
    if (isNaN(blockedId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    
    const result = await block.remove(req.userId, blockedId);
    
    if (!result) {
      return res.status(404).json({ error: 'Blocage non trouvé' });
    }
    
    res.json({ message: 'Utilisateur débloqué avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Vérifier si un utilisateur est bloqué
const checkBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetId = parseInt(userId);
    
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    
    const isBlocked = await block.isBlocked(req.userId, targetId);
    res.json({ blocked: isBlocked });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer la liste des utilisateurs bloqués
const getBlockedUsers = async (req, res) => {
  try {
    const blockedUsers = await block.getBlockedUsers(req.userId);
    res.json(blockedUsers);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { blockUser, unblockUser, checkBlock, getBlockedUsers };
