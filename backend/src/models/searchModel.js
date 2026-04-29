const pool = require("../db/pool");

const searchModel = {
  // Fonction privée pour construire la clause WHERE (pour éviter la duplication)
  _buildWhereClause(filters, currentUserId) {
    let whereClause = `u.id != $1 AND u.is_verified = true`;
    const values = [currentUserId];
    let paramIndex = 2;

    // Filtre par âge (basé sur birth_date)
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

    // Filtre par genre (préférences de l'utilisateur)
    if (filters.preferences && filters.preferences.length > 0) {
      whereClause += ` AND u.gender = ANY($${paramIndex}::text[])`;
      values.push(filters.preferences);
      paramIndex++;
    }

    // Filtre par localisation (distance en km)
    if (filters.latitude && filters.longitude && filters.distance) {
      whereClause += ` AND u.location_manual = false AND (
        6371 * acos(cos(radians($${paramIndex})) * cos(radians(u.latitude)) * 
        cos(radians(u.longitude) - radians($${paramIndex + 1})) + 
        sin(radians($${paramIndex})) * sin(radians(u.latitude))) <= $${paramIndex + 2}
      )`;
      values.push(filters.latitude, filters.longitude, filters.distance);
      paramIndex += 3;
    }

    // Filtre par popularité
    if (filters.popularityMin !== undefined) {
      whereClause += ` AND u.popularity_score >= $${paramIndex}`;
      values.push(filters.popularityMin);
      paramIndex++;
    }

    if (filters.popularityMax !== undefined) {
      whereClause += ` AND u.popularity_score <= $${paramIndex}`;
      values.push(filters.popularityMax);
      paramIndex++;
    }

    // Filtre par tags
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

    // Exclusion des utilisateurs bloqués
    whereClause += ` AND NOT EXISTS (
      SELECT 1 FROM blocks b 
      WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
      OR (b.blocker_id = u.id AND b.blocked_id = $1)
    )`;

    return { whereClause, values, nextIndex: paramIndex };
  },

  // Recherche avancée avec filtres
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
             (SELECT COUNT(*) FROM photos WHERE user_id = u.id) as photo_count,
             (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
      FROM users u
      WHERE ${whereClause}
    `;

    // Tri
    const allowedOrderBy = ["popularity_score", "last_seen", "created_at"];
    const orderBy = allowedOrderBy.includes(filters.orderBy)
      ? filters.orderBy
      : "popularity_score";
    const orderDirection = filters.orderDirection === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY ${orderBy} ${orderDirection}`;

    // Pagination
    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;
    query += ` LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  // Compter le nombre de résultats (pour la pagination)
  async countSearchResults(filters, currentUserId) {
    const { whereClause, values } = this._buildWhereClause(
      filters,
      currentUserId,
    );

    const query = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE ${whereClause}
    `;

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
  },

  // Calculer la distance entre deux points GPS (formule de Haversine)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
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

  // Suggestions intelligentes (version avec tri en JavaScript)
  async getSuggestions(userId, limit = 20) {
    // Récupérer les infos de l'utilisateur
    const userResult = await pool.query(
      `SELECT id, latitude, longitude, sexual_preferences 
       FROM users WHERE id = $1`,
      [userId],
    );

    if (userResult.rows.length === 0) return [];
    const user = userResult.rows[0];

    // Déterminer les genres préférés selon l'orientation sexuelle
    let preferredGenders = [];
    switch (user.sexual_preferences) {
      case "male":
        preferredGenders = ["male"];
        break;
      case "female":
        preferredGenders = ["female"];
        break;
      case "bisexual":
        preferredGenders = ["male", "female", "other"];
        break;
      default:
        preferredGenders = ["male", "female", "other"];
    }

    // Requête sans le tri complexe
    const query = `
      SELECT u.id, u.username, u.first_name, u.last_name, u.bio, 
             u.popularity_score, u.last_seen, u.latitude, u.longitude,
             (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo,
             COUNT(DISTINCT ut.tag_id) as common_tags
      FROM users u
      LEFT JOIN user_tags ut ON ut.user_id = u.id
      WHERE u.id != $1 
      AND u.is_verified = true
      AND u.gender = ANY($2::text[])
      AND u.id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $1)
      AND u.id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = $1)
      GROUP BY u.id
    `;

    const values = [userId, preferredGenders];
    const result = await pool.query(query, values);

    // Calculer la distance et trier en JavaScript
    const usersWithDistance = result.rows.map((userRow) => {
      let distance = null;
      if (
        user.latitude &&
        user.longitude &&
        userRow.latitude &&
        userRow.longitude
      ) {
        distance = this.calculateDistance(
          user.latitude,
          user.longitude,
          userRow.latitude,
          userRow.longitude,
        );
      }
      return { ...userRow, distance };
    });

    // Trier : d'abord ceux à moins de 10km, puis par tags communs, puis popularité
    usersWithDistance.sort((a, b) => {
      // Priorité à la proximité (distance <= 10km)
      const aClose = a.distance !== null && a.distance <= 10 ? 0 : 1;
      const bClose = b.distance !== null && b.distance <= 10 ? 0 : 1;
      if (aClose !== bClose) return aClose - bClose;

      // Ensuite par nombre de tags communs (décroissant)
      if (a.common_tags !== b.common_tags) return b.common_tags - a.common_tags;

      // Ensuite par popularité (décroissante)
      if (a.popularity_score !== b.popularity_score)
        return b.popularity_score - a.popularity_score;

      // Enfin par distance (croissante, les plus proches d'abord)
      if (a.distance !== null && b.distance !== null)
        return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0;
    });

    return usersWithDistance.slice(0, limit);
  },
};

module.exports = searchModel;
