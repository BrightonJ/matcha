const { notification } = require('../models');

// Récupérer mes notifications
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notification.getUserNotifications(req.userId);
    res.json(notifications);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Marquer une notification comme lue
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await notification.markAsRead(parseInt(id), req.userId);
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async (req, res) => {
  try {
    await notification.markAllAsRead(req.userId);
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Compter les notifications non lues
const getUnreadCount = async (req, res) => {
  try {
    const count = await notification.countUnread(req.userId);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer une notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await notification.delete(parseInt(id), req.userId);
    
    if (!result) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, getUnreadCount, deleteNotification };
