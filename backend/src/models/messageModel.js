const pool = require('../db/pool');

const messageModel = {
  // Envoyer un message
  async send(fromUserId, toUserId, content) {
    // Vérifier que les deux utilisateurs sont matchés
    const matchCheck = await pool.query(
      `SELECT * FROM likes l1
       JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
       WHERE (l1.from_user_id = $1 AND l1.to_user_id = $2)
       OR (l1.from_user_id = $2 AND l1.to_user_id = $1)`,
      [fromUserId, toUserId]
    );
    
    if (matchCheck.rows.length === 0) {
      throw new Error('Vous devez être matché pour envoyer un message');
    }
    
    // Vérifier que personne n'est bloqué
    const blockCheck = await pool.query(
      `SELECT * FROM blocks 
       WHERE (blocker_id = $1 AND blocked_id = $2)
       OR (blocker_id = $2 AND blocked_id = $1)`,
      [fromUserId, toUserId]
    );
    
    if (blockCheck.rows.length > 0) {
      throw new Error('Vous ne pouvez pas envoyer de message à cet utilisateur');
    }
    
    // Insérer le message
    const result = await pool.query(
      `INSERT INTO messages (from_user_id, to_user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, from_user_id, to_user_id, content, is_read, created_at`,
      [fromUserId, toUserId, content]
    );
    
    return result.rows[0];
  },
  
  // Récupérer les messages entre deux utilisateurs
  async getConversation(userId1, userId2, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT id, from_user_id, to_user_id, content, is_read, created_at
       FROM messages
       WHERE (from_user_id = $1 AND to_user_id = $2)
          OR (from_user_id = $2 AND to_user_id = $1)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId1, userId2, limit, offset]
    );
    return result.rows.reverse(); // Retourner dans l'ordre chronologique
  },
  
  // Marquer les messages comme lus
  async markAsRead(userId, fromUserId) {
    await pool.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE from_user_id = $1 AND to_user_id = $2 AND is_read = false`,
      [fromUserId, userId]
    );
  },
  
  // Compter les messages non lus
  async countUnread(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM messages 
       WHERE to_user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  },
  
  // Récupérer la liste des conversations
  async getConversations(userId) {
    const result = await pool.query(
      `SELECT 
         u.id as user_id, u.username, u.first_name, u.last_name,
         (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo,
         m.content as last_message,
         m.created_at as last_message_at,
         (SELECT COUNT(*) FROM messages WHERE to_user_id = $1 AND from_user_id = u.id AND is_read = false) as unread_count
       FROM users u
       JOIN (
         SELECT DISTINCT ON (other_user) other_user, content, created_at
         FROM (
           SELECT 
             CASE 
               WHEN from_user_id = $1 THEN to_user_id
               ELSE from_user_id
             END as other_user,
             content,
             created_at
           FROM messages
           WHERE from_user_id = $1 OR to_user_id = $1
           ORDER BY other_user, created_at DESC
         ) sub
       ) m ON m.other_user = u.id
       WHERE u.id IN (
         SELECT 
           CASE 
             WHEN from_user_id = $1 THEN to_user_id
             ELSE from_user_id
           END
         FROM likes l1
         JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
         WHERE l1.from_user_id = $1 OR l1.to_user_id = $1
       )
       ORDER BY m.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
};

module.exports = messageModel;
