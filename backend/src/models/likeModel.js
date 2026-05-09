const pool = require("../db/pool");
const notificationModel = require("./notificationModel");
const userModel = require("./userModel");

const likeModel = {
  // Ajouter un like
  async add(fromUserId, toUserId) {
    // Vérifier si l'utilisateur cible existe
    const targetUser = await pool.query("SELECT id FROM users WHERE id = $1", [
      toUserId,
    ]);

    if (targetUser.rows.length === 0) {
      const error = new Error("Utilisateur cible inexistant");
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    // Vérifier si l'utilisateur a une photo de profil
    const photoCheck = await pool.query(
      "SELECT id FROM photos WHERE user_id = $1 AND is_profile = true",
      [fromUserId],
    );

    if (photoCheck.rows.length === 0) {
      const error = new Error(
        "Vous devez avoir une photo de profil pour liker",
      );
      error.code = "NO_PROFILE_PHOTO";
      throw error;
    }

    // Vérifier si le like existe déjà
    const existing = await pool.query(
      "SELECT * FROM likes WHERE from_user_id = $1 AND to_user_id = $2",
      [fromUserId, toUserId],
    );

    if (existing.rows.length > 0) {
      const error = new Error("Like déjà existant");
      error.code = "LIKE_ALREADY_EXISTS";
      throw error;
    }

    // Ajouter le like
    const result = await pool.query(
      "INSERT INTO likes (from_user_id, to_user_id) VALUES ($1, $2) RETURNING *",
      [fromUserId, toUserId],
    );

    // Vérifier si c'est un match
    const mutual = await pool.query(
      "SELECT * FROM likes WHERE from_user_id = $1 AND to_user_id = $2",
      [toUserId, fromUserId],
    );

    const isMatch = mutual.rows.length > 0;

    // Mettre à jour la popularité des deux utilisateurs
    await this.updatePopularityScore(fromUserId);
    await this.updatePopularityScore(toUserId);

    // Créer une notification de like
    const fromUser = await userModel.findById(fromUserId);
    const notification = await notificationModel.create(
      toUserId,
      "like",
      fromUserId,
      `${fromUser.username} vous a liké`,
      { likeId: result.rows[0].id },
    );

    // Envoyer en temps réel
    const io = global.io;
    if (!io) {
      const error = new Error("Socket.io not initialized");
      error.code = "SOCKET_IO_NOT_INITIALIZED";
      throw error;
    }
    io.to(`user:${toUserId}`).emit("notification", notification);

    // Si c'est un match, créer une notification de match
    if (isMatch) {
      const toUser = await userModel.findById(toUserId);
      const matchNotification = await notificationModel.create(
        fromUserId,
        "match",
        toUserId,
        `${toUser.username} vous a liké en retour ! C'est un match !`,
        { match: true },
      );
      io.to(`user:${fromUserId}`).emit("notification", matchNotification);

      const fromUser = await userModel.findById(fromUserId);
      const matchNotification2 = await notificationModel.create(
        toUserId,
        "match",
        fromUserId,
        `${fromUser.username} vous a liké en retour ! C'est un match !`,
        { match: true },
      );
      io.to(`user:${toUserId}`).emit("notification", matchNotification2);
    }

    return {
      like: result.rows[0],
      isMatch,
    };
  },

  // Supprimer un like
  async remove(fromUserId, toUserId) {
    const result = await pool.query(
      "DELETE FROM likes WHERE from_user_id = $1 AND to_user_id = $2 RETURNING *",
      [fromUserId, toUserId],
    );

    if (result.rows.length) {
      // Mettre à jour la popularité des deux utilisateurs
      await this.updatePopularityScore(fromUserId);
      await this.updatePopularityScore(toUserId);

      // Créer une notification d'unlike
      const fromUser = await userModel.findById(fromUserId);
      const notification = await notificationModel.create(
        toUserId,
        "unlike",
        fromUserId,
        `${fromUser.username} a retiré son like`,
        { unlike: true },
      );
      const io = global.io;
      if (!io) {
        const error = new Error("Socket.io not initialized");
        error.code = "SOCKET_IO_NOT_INITIALIZED";
        throw error;
      }
      io.to(`user:${toUserId}`).emit("notification", notification);
    }

    return result.rows[0] || null;
  },

  // Vérifier si un like existe
  async exists(fromUserId, toUserId) {
    const result = await pool.query(
      "SELECT * FROM likes WHERE from_user_id = $1 AND to_user_id = $2",
      [fromUserId, toUserId],
    );
    return result.rows.length > 0;
  },

  // Vérifier si deux utilisateurs sont matchés
  async isMatch(userId1, userId2) {
    const result = await pool.query(
      "SELECT * FROM likes WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)",
      [userId1, userId2],
    );
    return result.rows.length === 2;
  },

  // Récupérer les likes reçus
  async getReceivedLikes(userId) {
    const result = await pool.query(
      `SELECT l.*, u.username, u.first_name, u.last_name,
              (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
       FROM likes l
       JOIN users u ON u.id = l.from_user_id
       WHERE l.to_user_id = $1
       ORDER BY l.created_at DESC`,
      [userId],
    );
    return result.rows;
  },

  // Récupérer les likes envoyés
  async getSentLikes(userId) {
    const result = await pool.query(
      `SELECT l.*, u.username, u.first_name, u.last_name,
              (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
       FROM likes l
       JOIN users u ON u.id = l.to_user_id
       WHERE l.from_user_id = $1
       ORDER BY l.created_at DESC`,
      [userId],
    );
    return result.rows;
  },

  // Récupérer les matchs d'un utilisateur
  async getMatches(userId) {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.username, u.first_name, u.last_name, u.last_seen,
              (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
       FROM likes l1
       JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
       JOIN users u ON (u.id = l1.from_user_id OR u.id = l1.to_user_id)
       WHERE (l1.from_user_id = $1 OR l1.to_user_id = $1)
         AND u.id != $1
       GROUP BY u.id`,
      [userId],
    );
    return result.rows;
  },

  // Compter les likes reçus
  async countReceivedLikes(userId) {
    const result = await pool.query(
      "SELECT COUNT(*) FROM likes WHERE to_user_id = $1",
      [userId],
    );
    return parseInt(result.rows[0].count);
  },

  // Recalculer le score de popularité d'un utilisateur
  async updatePopularityScore(userId) {
    // Compter les likes reçus
    const likesReceived = await this.countReceivedLikes(userId);

    // Compter les matchs
    const matchesResult = await pool.query(
      `SELECT COUNT(*) FROM (
      SELECT l1.from_user_id 
      FROM likes l1
      JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
      WHERE l1.to_user_id = $1
      GROUP BY l1.from_user_id
    ) AS matches`,
      [userId],
    );
    const matchCount = parseInt(matchesResult.rows[0].count);

    let score = likesReceived * 20 + matchCount * 10;

    if (score > 1000) score = 1000;

    // Mettre à jour dans la base
    await pool.query("UPDATE users SET popularity_score = $1 WHERE id = $2", [
      score,
      userId,
    ]);

    return score;
  },
};

module.exports = likeModel;
