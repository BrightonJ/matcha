const pool = require("../db/pool");
const {like: likeModel} = require("./likeModel");

const blockModel = {
  // Bloquer un utilisateur
  async add(blockerId, blockedId) {
    // Vérifier si déjà bloqué
    const existing = await pool.query(
      "SELECT * FROM blocks WHERE blocker_id = $1 AND blocked_id = $2",
      [blockerId, blockedId],
    );

    if (existing.rows.length > 0) {
      return null;
    }

    // Ajouter le blocage
    const result = await pool.query(
      "INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) RETURNING *",
      [blockerId, blockedId],
    );

    // Supprimer les likes existants entre les deux utilisateurs
    await likeModel.remove(blockerId, blockedId);
    await likeModel.remove(blockedId, blockerId);

    return result.rows[0];
  },

  // Débloquer un utilisateur
  async remove(blockerId, blockedId) {
    const result = await pool.query(
      "DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING *",
      [blockerId, blockedId],
    );
    return result.rows[0] || null;
  },

  // Vérifier si un utilisateur est bloqué
  async isBlocked(userId, targetId) {
    const result = await pool.query(
      "SELECT * FROM blocks WHERE blocker_id = $1 AND blocked_id = $2",
      [userId, targetId],
    );
    return result.rows.length > 0;
  },

  // Récupérer la liste des utilisateurs bloqués
  async getBlockedUsers(userId) {
    const result = await pool.query(
      `SELECT b.*, u.username, u.first_name, u.last_name,
              (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
       FROM blocks b
       JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id = $1
       ORDER BY b.created_at DESC`,
      [userId],
    );
    return result.rows;
  },
};

module.exports = blockModel;
