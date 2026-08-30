const pool = require("../db/pool");

const searchModel = {
  _buildWhereClause(filters, currentUserId) {
    let whereClause = `u.id != $1 AND u.is_verified = true`;
    const values = [currentUserId];
    let paramIndex = 2;

    if (filters.ageMin) {
      whereClause += ` AND EXTRACT(YEAR FROM age(CURRENT_DATE, u.birth_date)) >= $${paramIndex}`;
      values.push(filters.ageMin);
      paramIndex++;
    }

    if (filters.ageMax) {
      whereClause += ` AND EXTRACT(YEAR FROM age(CURRENT_DATE, u.birth_date)) <= $${paramIndex}`;
      values.push(filters.ageMax);
      paramIndex++;
    }

    if (filters.preferences && filters.preferences.length > 0) {
      whereClause += ` AND u.gender = ANY($${paramIndex}::text[])`;
      values.push(filters.preferences);
      paramIndex++;
    }

    if (filters.latitude && filters.longitude && filters.distance) {
      whereClause += ` AND u.location_manual = false AND (
        6371 * acos(cos(radians($${paramIndex})) * cos(radians(u.latitude)) * 
        cos(radians(u.longitude) - radians($${paramIndex + 1})) + 
        sin(radians($${paramIndex})) * sin(radians(u.latitude))) <= $${paramIndex + 2}
      )`;
      values.push(filters.latitude, filters.longitude, filters.distance);
      paramIndex += 3;
    }

    if (filters.popularityMin !== null && filters.popularityMin !== undefined) {
      whereClause += ` AND u.popularity_score >= $${paramIndex}`;
      values.push(filters.popularityMin);
      paramIndex++;
    }

    if (filters.popularityMax !== null && filters.popularityMax !== undefined) {
      whereClause += ` AND u.popularity_score <= $${paramIndex}`;
      values.push(filters.popularityMax);
      paramIndex++;
    }

    if (filters.tags && filters.tags.length > 0) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM user_tags ut
        JOIN tags t ON t.id = ut.tag_id
        WHERE ut.user_id = u.id AND t.name = ANY($${paramIndex}::text[])
        GROUP BY ut.user_id
        HAVING COUNT(DISTINCT t.name) >= ${filters.tags.length}
      )`;
      values.push(filters.tags);
      paramIndex++;
    }

    whereClause += ` AND NOT EXISTS (
      SELECT 1 FROM blocks b 
      WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
      OR (b.blocker_id = u.id AND b.blocked_id = $1)
    )`;

    return { whereClause, values, nextIndex: paramIndex };
  },

  async searchUsers(filters, currentUserId) {
    const { whereClause, values, nextIndex } = this._buildWhereClause(
      filters,
      currentUserId,
    );

    let query = `
      SELECT u.id, u.username, u.first_name, u.last_name, u.bio, u.gender, 
             u.sexual_preferences, u.is_verified, u.popularity_score, u.last_seen,
             u.latitude, u.longitude, u.location_city, u.location_manual,
             u.birth_date,
             EXTRACT(YEAR FROM age(CURRENT_DATE, u.birth_date)) as age,
             (SELECT COUNT(*) FROM photos WHERE user_id = u.id) as photo_count,
             (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo,
             (SELECT is_external FROM photos WHERE user_id = u.id AND is_profile = true) as photo_is_external,
             (SELECT COUNT(*) FROM user_tags WHERE user_id = u.id AND tag_id IN 
                (SELECT tag_id FROM user_tags WHERE user_id = $1)) as common_tags,
             COALESCE(
               (SELECT json_agg(t.name) 
                FROM user_tags ut 
                JOIN tags t ON t.id = ut.tag_id 
                WHERE ut.user_id = u.id),
               '[]'
             ) as tags
      FROM users u
      WHERE ${whereClause}
    `;

    const allowedOrderBy = ["popularity_score", "age", "location_city", "common_tags"];
    const orderBy = allowedOrderBy.includes(filters.orderBy)
      ? filters.orderBy
      : "popularity_score";
    const orderDirection = filters.orderDirection === "ASC" ? "ASC" : "DESC";
    
    query += ` ORDER BY ${orderBy} ${orderDirection}`;

    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;
    
    const finalValues = [...values, limit, offset];
    
    query += ` LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`;

    const result = await pool.query(query, finalValues);

    return result.rows.map((row) => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || "[]"),
    }));
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  async getSuggestions(userId, limit = 20, offset = 0) {
    const userResult = await pool.query(
      `SELECT id, latitude, longitude, sexual_preferences FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return [];
    const user = userResult.rows[0];

    let preferredGenders = ['male', 'female', 'other'];
    if (user.sexual_preferences === 'male') {
      preferredGenders = ['male'];
    } else if (user.sexual_preferences === 'female') {
      preferredGenders = ['female'];
    }

    let query = `
      SELECT u.id, u.username, u.first_name, u.last_name, u.bio, 
             u.popularity_score, u.last_seen, u.latitude, u.longitude, 
             u.location_city, u.location_manual, u.birth_date,
             u.is_online,
             EXTRACT(YEAR FROM age(CURRENT_DATE, u.birth_date)) as age,
             (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo,
             (SELECT is_external FROM photos WHERE user_id = u.id AND is_profile = true) as photo_is_external,
             COALESCE(
               (SELECT json_agg(t.name) 
                FROM user_tags ut 
                JOIN tags t ON t.id = ut.tag_id 
                WHERE ut.user_id = u.id),
               '[]'
             ) as tags,
             COUNT(DISTINCT ut.tag_id) as common_tags
      FROM users u
      LEFT JOIN user_tags ut ON ut.user_id = u.id
      WHERE u.id != $1 
      AND u.is_verified = true
      AND u.gender = ANY($2::text[])
      AND u.id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $1)
      AND u.id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = $1)
      GROUP BY u.id
      ORDER BY common_tags DESC, u.popularity_score DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await pool.query(query, [userId, preferredGenders, limit, offset]);

    return result.rows.map((row) => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || "[]"),
    }));
  }
};

module.exports = searchModel;