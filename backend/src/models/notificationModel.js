const pool = require("../db/pool");

const notificationModel = {
  // Créer une notification
  async create(userId, type, fromUserId, content, metadata = {}) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, from_user_id, content, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, fromUserId, content, metadata],
    );
    return result.rows[0];
  },

  // Récupérer les notifications d'un utilisateur (non lues d'abord)
  async getUserNotifications(userId, limit = 50) {
    const result = await pool.query(
      `SELECT n.*, u.username, u.first_name, u.last_name,
              (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
       FROM notifications n
       JOIN users u ON u.id = n.from_user_id
       WHERE n.user_id = $1
       ORDER BY n.is_read ASC, n.created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId, userId) {
    await pool.query(
      "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
      [notificationId, userId],
    );
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId) {
    await pool.query(
      "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
      [userId],
    );
  },

  // Compter les notifications non lues
  async countUnread(userId) {
    const result = await pool.query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
      [userId],
    );
    return parseInt(result.rows[0].count);
  },

  // Supprimer une notification (optionnel)
  async delete(notificationId, userId) {
    await pool.query(
      "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
      [notificationId, userId],
    );
  },

  // Nettoyer les anciennes notifications (plus de 30 jours)
  async cleanOldNotifications(days = 30) {
    await pool.query(
      "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '$1 days'",
      [days],
    );
  },
};

module.exports = notificationModel;
