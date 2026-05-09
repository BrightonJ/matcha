const {
  user: userModel,
  message: messageModel,
  notification: notificationModel,
  like: likeModel,
  block: blockModel,
} = require("../models");

// Envoyer un message à un utilisateur
const sendMessage = async (req, res) => {
  try {
    const { toUserId } = req.params;
    const { content } = req.body;
    const fromUserId = req.userId;

    if (!content || content.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Le message ne peut pas être vide" });
    }

    // Vérifier que les deux utilisateurs sont matchés
    const isMatch = await likeModel.isMatch(fromUserId, parseInt(toUserId));
    if (!isMatch) {
      return res.status(403).json({ error: "Vous devez être matché pour envoyer un message" });
    }
    
    // Vérifier que personne n'est bloqué
    const blockedHim = await blockModel.isBlocked(fromUserId, parseInt(toUserId));
    const blockedByHim = await blockModel.isBlocked(parseInt(toUserId), fromUserId);
    if (blockedHim || blockedByHim) {
      return res.status(403).json({ error: "Vous ne pouvez pas envoyer de message à cet utilisateur" });
    }

    const newMessage = await messageModel.send(
      fromUserId,
      parseInt(toUserId),
      content,
    );

    // Créer une notification de message
    const fromUser = await userModel.findById(fromUserId);
    const notification = await notificationModel.create(
      toUserId,
      "message",
      fromUserId,
      `${fromUser.username} vous a envoyé un message`,
      { messageId: newMessage.id },
    );

    const io = global.io;
    if (!io) {
      const error = Error("Socket.io not initialized");
      error.code = "SOCKET_IO_NOT_INITIALIZED";
      throw error;
    }
    io.to(`user:${toUserId}`).emit("notification", notification);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Erreur:", error);
    if (error.message === "Vous devez être matché pour envoyer un message") {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Récupérer la conversation avec un utilisateur
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await messageModel.getConversation(
      req.userId,
      parseInt(userId),
      limit,
      offset,
    );

    // Marquer comme lus
    await messageModel.markAsRead(req.userId, parseInt(userId));

    res.json(messages);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Récupérer toutes les conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await messageModel.getConversations(req.userId);
    res.json(conversations);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Compter les messages non lus
const getUnreadCount = async (req, res) => {
  try {
    const count = await messageModel.countUnread(req.userId);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  getUnreadCount,
};
