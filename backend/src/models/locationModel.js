const pool = require('../db/pool');

const locationModel = {
  // Mettre à jour la localisation GPS
  async updateGps(userId, latitude, longitude) {
    const result = await pool.query(
      `UPDATE users 
       SET latitude = $1, longitude = $2, location_manual = FALSE, updated_at = NOW()
       WHERE id = $3
       RETURNING id, latitude, longitude, location_city, location_manual`,
      [latitude, longitude, userId]
    );
    return result.rows[0] || null;
  },

  // Mettre à jour la localisation manuelle
  async updateManual(userId, city) {
    const result = await pool.query(
      `UPDATE users 
       SET location_city = $1, location_manual = TRUE, latitude = NULL, longitude = NULL, updated_at = NOW()
       WHERE id = $2
       RETURNING id, latitude, longitude, location_city, location_manual`,
      [city, userId]
    );
    return result.rows[0] || null;
  },

  // Récupérer la localisation d'un utilisateur
  async getUserLocation(userId) {
    const result = await pool.query(
      `SELECT latitude, longitude, location_city, location_manual 
       FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  // Désactiver la localisation
  async disable(userId) {
    const result = await pool.query(
      `UPDATE users 
       SET latitude = NULL, longitude = NULL, location_city = NULL, location_manual = FALSE, updated_at = NOW()
       WHERE id = $1
       RETURNING id, latitude, longitude, location_city, location_manual`,
      [userId]
    );
    return result.rows[0] || null;
  }
};

module.exports = locationModel;
