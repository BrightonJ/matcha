const pool = require('../db/pool');
const notificationModel = require('./notificationModel');

const likeModel = {
  async updatePopularityScore(userId) {
    const likesReceived = await this.countReceivedLikes(userId);
    
    const matchesResult = await pool.query(
      `SELECT COUNT(*) FROM (
        SELECT l1.from_user_id 
        FROM likes l1
        JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
        WHERE l1.to_user_id = $1
        GROUP BY l1.from_user_id
      ) AS matches`,
      [userId]
    );
    const matchCount = parseInt(matchesResult.rows[0].count);
    
    let score = (likesReceived * 20) + (matchCount * 10);
    if (score > 1000) score = 1000;
    
    await pool.query(
      'UPDATE users SET popularity_score = $1 WHERE id = $2',
      [score, userId]
    );
    
    return score;
  },

  async add(fromUserId, toUserId, io) {
    const targetUser = await pool.query(
      'SELECT id, username, first_name, last_name FROM users WHERE id = $1',
      [toUserId]
    );
    
    if (targetUser.rows.length === 0) {
      const error = new Error('Utilisateur cible inexistant');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    
    const photoCheck = await pool.query(
      'SELECT id FROM photos WHERE user_id = $1 AND is_profile = true',
      [fromUserId]
    );
    
    if (photoCheck.rows.length === 0) {
      const error = new Error('Vous devez avoir une photo de profil pour liker');
      error.code = 'NO_PROFILE_PHOTO';
      throw error;
    }
    
    const existing = await pool.query(
      'SELECT * FROM likes WHERE from_user_id = $1 AND to_user_id = $2',
      [fromUserId, toUserId]
    );
    
    if (existing.rows.length > 0) {
      const error = new Error('Like déjà existant');
      error.code = 'LIKE_ALREADY_EXISTS';
      throw error;
    }
    
    const blockCheck = await pool.query(
      'SELECT * FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [fromUserId, toUserId]
    );
    
    if (blockCheck.rows.length > 0) {
      const error = new Error('Vous ne pouvez pas liker cet utilisateur');
      error.code = 'BLOCKED';
      throw error;
    }
    
    const fromUser = await pool.query(
      'SELECT id, username, first_name, last_name FROM users WHERE id = $1',
      [fromUserId]
    );
    
    const result = await pool.query(
      'INSERT INTO likes (from_user_id, to_user_id) VALUES ($1, $2) RETURNING *',
      [fromUserId, toUserId]
    );
    
    const likeNotification = await notificationModel.create(
      toUserId,
      'like',
      fromUserId,
      `${fromUser.rows[0].first_name} ${fromUser.rows[0].last_name} vous a liké`,
      { likeId: result.rows[0].id }
    );
    
    if (io) {
      io.to(`user:${toUserId}`).emit('notification', likeNotification);
    }
    
    const mutual = await pool.query(
      'SELECT * FROM likes WHERE from_user_id = $1 AND to_user_id = $2',
      [toUserId, fromUserId]
    );
    
    const isMatch = mutual.rows.length > 0;
    
    if (isMatch && io) {
      const matchNotification1 = await notificationModel.create(
        fromUserId,
        'match',
        toUserId,
        `${targetUser.rows[0].first_name} ${targetUser.rows[0].last_name} vous a liké en retour ! C'est un match !`,
        { match: true }
      );
      
      const matchNotification2 = await notificationModel.create(
        toUserId,
        'match',
        fromUserId,
        `${fromUser.rows[0].first_name} ${fromUser.rows[0].last_name} vous a liké en retour ! C'est un match !`,
        { match: true }
      );
      
      io.to(`user:${fromUserId}`).emit('notification', matchNotification1);
      io.to(`user:${toUserId}`).emit('notification', matchNotification2);
    }
    
    await this.updatePopularityScore(fromUserId);
    await this.updatePopularityScore(toUserId);
    
    return {
      like: result.rows[0],
      isMatch
    };
  },
  
  async remove(fromUserId, toUserId, io) {
    const wasMatch = await this.isMatch(fromUserId, toUserId);
    
    const result = await pool.query(
      'DELETE FROM likes WHERE from_user_id = $1 AND to_user_id = $2 RETURNING *',
      [fromUserId, toUserId]
    );
    
    if (result.rows.length > 0 && wasMatch && io) {
      const fromUser = await pool.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [fromUserId]
      );
      
      const unlikeNotification = await notificationModel.create(
        toUserId,
        'unlike',
        fromUserId,
        `${fromUser.rows[0].first_name} ${fromUser.rows[0].last_name} a retiré son like`,
        { unlike: true }
      );
      
      io.to(`user:${toUserId}`).emit('notification', unlikeNotification);
    }
    
    await this.updatePopularityScore(fromUserId);
    await this.updatePopularityScore(toUserId);
    
    return result.rows[0] || null;
  },
  
  async exists(fromUserId, toUserId) {
    const result = await pool.query(
      'SELECT * FROM likes WHERE from_user_id = $1 AND to_user_id = $2',
      [fromUserId, toUserId]
    );
    return result.rows.length > 0;
  },
  
  async isMatch(userId1, userId2) {
    const result = await pool.query(
      'SELECT * FROM likes WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)',
      [userId1, userId2]
    );
    return result.rows.length === 2;
  },
  
  async getReceivedLikes(userId) {
    const result = await pool.query(
      `SELECT l.*, u.username, u.first_name, u.last_name,
              (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
       FROM likes l
       JOIN users u ON u.id = l.from_user_id
       WHERE l.to_user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );
    return result.rows;
  },
  
  async getSentLikes(userId) {
    const result = await pool.query(
      `SELECT l.*, u.username, u.first_name, u.last_name,
              (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
       FROM likes l
       JOIN users u ON u.id = l.to_user_id
       WHERE l.from_user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );
    return result.rows;
  },
  
  async getMatches(userId) {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.username, u.first_name, u.last_name, u.last_seen, u.is_online,
              (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
       FROM likes l1
       JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
       JOIN users u ON (u.id = l1.from_user_id OR u.id = l1.to_user_id)
       WHERE (l1.from_user_id = $1 OR l1.to_user_id = $1)
         AND u.id != $1
       GROUP BY u.id`,
      [userId]
    );
    return result.rows;
  },
  
  async countReceivedLikes(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE to_user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
};

module.exports = likeModel;
