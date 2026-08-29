const pool = require('../db/pool');

const tagModel = {
  async getAll() {
    const result = await pool.query('SELECT id, name FROM tags ORDER BY name');
    return result.rows;
  },

  async getUserTags(userId) {
    const result = await pool.query(
      `SELECT t.id, t.name FROM tags t
       JOIN user_tags ut ON ut.tag_id = t.id
       WHERE ut.user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  async addToUser(userId, tagId) {
    const result = await pool.query(
      'INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [userId, tagId]
    );
    return result.rows[0] || null;
  },

  async removeFromUser(userId, tagId) {
    const result = await pool.query(
      'DELETE FROM user_tags WHERE user_id = $1 AND tag_id = $2 RETURNING *',
      [userId, tagId]
    );
    return result.rows[0] || null;
  },

  async findByName(name) {
    const result = await pool.query(
      'SELECT id, name FROM tags WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  },

  async create(name) {
    const result = await pool.query(
      'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name]
    );
    if (result.rows[0]) return result.rows[0];
    return this.findByName(name);
  }
};

module.exports = tagModel;