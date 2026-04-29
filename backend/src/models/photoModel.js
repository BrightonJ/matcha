const pool = require("../db/pool");
const fs = require("fs");
const path = require("path");

const photoModel = {
  // Ajouter une photo
  async add(userId, url, isProfile = false) {
    if (isProfile) {
      await pool.query(
        "UPDATE photos SET is_profile = false WHERE user_id = $1",
        [userId],
      );
    }

    const result = await pool.query(
      `INSERT INTO photos (user_id, url, is_profile)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, url, is_profile, created_at`,
      [userId, url, isProfile],
    );

    return result.rows[0];
  },

  // Récupérer toutes les photos d'un utilisateur
  async getUserPhotos(userId) {
    const result = await pool.query(
      "SELECT id, url, is_profile, created_at FROM photos WHERE user_id = $1 ORDER BY id",
      [userId],
    );
    return result.rows;
  },

  // Récupérer une photo par son ID
  async findById(photoId, userId = null) {
    let query = "SELECT id, url, is_profile, user_id FROM photos WHERE id = $1";
    const params = [photoId];

    if (userId) {
      query += " AND user_id = $2";
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },

  // Définir la photo de profil
  async setProfile(userId, photoId) {
    // Vérifier que la photo appartient à l'utilisateur
    const photo = await this.findById(photoId, userId);
    if (!photo) {
      throw new Error("Photo non trouvée");
    }

    await pool.query(
      "UPDATE photos SET is_profile = false WHERE user_id = $1",
      [userId],
    );

    await pool.query(
      "UPDATE photos SET is_profile = true WHERE id = $1 AND user_id = $2",
      [photoId, userId],
    );

    return { success: true };
  },

  // Supprimer une photo
  async delete(photoId, userId) {
    // Récupérer la photo
    const photo = await pool.query(
      "SELECT id, url, is_profile, user_id FROM photos WHERE id = $1 AND user_id = $2",
      [photoId, userId],
    );

    if (photo.rows.length === 0) {
      return null;
    }

    const photoData = photo.rows[0];

    // Supprimer la photo de la base de données
    await pool.query("DELETE FROM photos WHERE id = $1 AND user_id = $2", [
      photoId,
      userId,
    ]);

    // Supprimer le fichier physique
    if (photoData.url) {
      const filePath = path.join(__dirname, "../../", photoData.url);
      try {
        fs.unlinkSync(filePath);
        console.log(`Fichier supprimé: ${filePath}`);
      } catch (err) {
        console.error(
          `Fichier introuvable ou erreur: ${filePath}`,
          err.message,
        );
      }
    }

    // Si photo de profil, en promouvoir une autre
    if (photoData.is_profile) {
      const remaining = await pool.query(
        "SELECT id FROM photos WHERE user_id = $1 ORDER BY id LIMIT 1",
        [userId],
      );
      if (remaining.rows.length > 0) {
        await pool.query("UPDATE photos SET is_profile = true WHERE id = $1", [
          remaining.rows[0].id,
        ]);
      }
    }

    return photoData;
  },

  // Compter les photos d'un utilisateur
  async count(userId) {
    const result = await pool.query(
      "SELECT COUNT(*) FROM photos WHERE user_id = $1",
      [userId],
    );
    return parseInt(result.rows[0].count);
  },
};

module.exports = photoModel;
