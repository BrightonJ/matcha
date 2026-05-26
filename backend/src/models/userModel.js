const pool = require("../db/pool");

const userModel = {
  // Trouver un utilisateur par email
  async findByEmail(email) {
    const result = await pool.query(
      "SELECT id, email, username, first_name, last_name, password_hash, is_verified, created_at FROM users WHERE email = $1",
      [email],
    );
    return result.rows[0] || null;
  },

  // Trouver un utilisateur par username
  async findByUsername(username) {
    const result = await pool.query(
      "SELECT id, email, username, first_name, last_name, password_hash, is_verified, created_at FROM users WHERE username = $1",
      [username],
    );
    return result.rows[0] || null;
  },

  // Trouver un utilisateur par username (avec mot de passe pour login)
  async findByUsernameWithPassword(username) {
    const result = await pool.query(
      "SELECT id, email, username, first_name, last_name, password_hash, is_verified FROM users WHERE username = $1",
      [username],
    );
    return result.rows[0] || null;
  },

  // Trouver un utilisateur par ID
  async findById(id) {
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name, is_verified, created_at, 
            bio, gender, sexual_preferences, popularity_score, last_seen, birth_date,
            location_city, latitude, longitude, location_manual, is_online,
            (SELECT url FROM photos WHERE user_id = users.id AND is_profile = true) as profile_photo,
            (SELECT is_external FROM photos WHERE user_id = users.id AND is_profile = true) as photo_is_external
     FROM users WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];

    const tagsResult = await pool.query(
      `SELECT t.name 
     FROM tags t
     JOIN user_tags ut ON ut.tag_id = t.id
     WHERE ut.user_id = $1`,
      [id],
    );

    user.tags = tagsResult.rows.map((row) => `#${row.name}`);

    return user;
  },

  // Créer un utilisateur
  async create({ email, username, firstName, lastName, passwordHash }) {
    const result = await pool.query(
      `INSERT INTO users (email, username, first_name, last_name, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, first_name, last_name, is_verified, created_at`,
      [email, username, firstName, lastName, passwordHash],
    );
    return result.rows[0];
  },

  // Créer un utilisateur avec token de vérification
  async createWithVerification({
    email,
    username,
    firstName,
    lastName,
    passwordHash,
    verificationToken,
    verificationExpires,
  }) {
    const result = await pool.query(
      `INSERT INTO users (email, username, first_name, last_name, password_hash, verification_token, verification_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, username, first_name, last_name, is_verified, created_at`,
      [
        email,
        username,
        firstName,
        lastName,
        passwordHash,
        verificationToken,
        verificationExpires,
      ],
    );
    return result.rows[0];
  },

  // Mettre à jour le profil utilisateur
  async updateProfile(userId, updates) {
    const allowedFields = [
      "first_name",
      "last_name",
      "email",
      "bio",
      "gender",
      "sexual_preferences",
      "birth_date",
    ];
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${index} 
     RETURNING id, email, username, first_name, last_name, bio, gender, sexual_preferences, is_verified, created_at, updated_at, birth_date`,
      values,
    );

    return result.rows[0] || null;
  },

  // Vérifier si un email existe déjà
  async emailExists(email) {
    const result = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows.length > 0;
  },

  // Vérifier si un username existe déjà
  async usernameExists(username) {
    const result = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    return result.rows.length > 0;
  },

  // Vérification email
  async findByVerificationToken(token) {
    const result = await pool.query(
      "SELECT id, email, username FROM users WHERE verification_token = $1 AND verification_expires > NOW()",
      [token],
    );
    return result.rows[0] || null;
  },

  async verifyUser(userId) {
    await pool.query(
      "UPDATE users SET is_verified = true, verification_token = NULL, verification_expires = NULL WHERE id = $1",
      [userId],
    );
  },

  // Mettre à jour last_seen
  async updateLastSeen(userId) {
    await pool.query("UPDATE users SET last_seen = NOW() WHERE id = $1", [
      userId,
    ]);
  },

  // Mettre à jour le statut en ligne
  async updateOnlineStatus(userId, isOnline) {
    await pool.query(
      "UPDATE users SET is_online = $1, last_seen = NOW() WHERE id = $2",
      [isOnline, userId],
    );
  },
};

module.exports = userModel;
