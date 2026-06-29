const pool = require('../db/pool');

const reportModel = {
  async add(reporterId, reportedId) {
    const existing = await pool.query(
      'SELECT * FROM reports WHERE reporter_id = $1 AND reported_id = $2',
      [reporterId, reportedId]
    );

    if (existing.rows.length > 0) {
      return null;
    }

    const result = await pool.query(
      'INSERT INTO reports (reporter_id, reported_id) VALUES ($1, $2) RETURNING *',
      [reporterId, reportedId]
    );

    return result.rows[0];
  }
};

module.exports = reportModel;