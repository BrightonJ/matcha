const pool = require("../db/pool");

const visitModel = {
  // Enregistrer une visite
  async add(visitorId, visitedId) {
    // Ne pas enregistrer si on visite son propre profil
    if (visitorId === visitedId) return null;

    // Vérifier si l'utilisateur visité existe
    const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [
      visitedId,
    ]);
    if (userExists.rows.length === 0) return null;

    // Met a jour la date de la visite sinon creer une nouvelle visite
    const existingVisit = await pool.query(
      "SELECT id FROM visits WHERE visitor_id = $1 AND visited_id = $2",
      [visitorId, visitedId],
    );

    if (existingVisit.rows.length > 0) {
      await pool.query("UPDATE visits SET viewed_at = NOW() WHERE id = $1",
        [existingVisit.rows[0].id],
	);
      return existingVisit.rows[0];
    }

    // Insérer la visite
    const result = await pool.query(
	  "INSERT INTO visits (visitor_id, visited_id) VALUES ($1, $2) RETURNING *",
	  [visitorId, visitedId],
	);

    return result.rows[0] || null;
  },

  // Récupérer les visiteurs de mon profil
  async getMyVisitors(userId, limit = 50) {
    const result = await pool.query(
      `SELECT DISTINCT ON (v.visitor_id) 
              v.visitor_id, v.viewed_at,
              u.username, u.first_name, u.last_name,
              (SELECT url FROM photos WHERE user_id = u.id AND is_profile = true) as profile_photo
       FROM visits v
       JOIN users u ON u.id = v.visitor_id
       WHERE v.visited_id = $1
       ORDER BY v.visitor_id, v.viewed_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  },

  // Compter le nombre de visites reçues
  async countVisits(userId) {
    const result = await pool.query(
      "SELECT COUNT(DISTINCT visitor_id) FROM visits WHERE visited_id = $1",
      [userId],
    );
    return parseInt(result.rows[0].count);
  },
};

module.exports = visitModel;
