const { message } = require('../models');

// Envoyer un message à un utilisateur
const sendMessage = async (req, res) => {
  try {
    const { toUserId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide' });
    }
    
    const newMessage = await message.send(req.userId, parseInt(toUserId), content);
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Erreur:', error);
    if (error.message === 'Vous devez être matché pour envoyer un message') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer la conversation avec un utilisateur
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const messages = await message.getConversation(req.userId, parseInt(userId), limit, offset);
    
    // Marquer comme lus
    await message.markAsRead(req.userId, parseInt(userId));
    
    res.json(messages);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer toutes les conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await message.getConversations(req.userId);
    res.json(conversations);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Compter les messages non lus
const getUnreadCount = async (req, res) => {
  try {
    const count = await message.countUnread(req.userId);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { sendMessage, getConversation, getConversations, getUnreadCount };
