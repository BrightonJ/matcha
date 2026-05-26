const pool = require('../db/pool');
const fs = require('fs');
const path = require('path');

const photoModel = {
  // Ajouter une photo
  async add(userId, url, isProfile = false, isExternal = false) {
    if (isProfile) {
      await pool.query(
        'UPDATE photos SET is_profile = false WHERE user_id = $1',
        [userId]
      );
    }
    
    const result = await pool.query(
      `INSERT INTO photos (user_id, url, is_profile, is_external)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, url, is_profile, is_external, created_at`,
      [userId, url, isProfile, isExternal]
    );
    
    return result.rows[0];
  },

  // Récupérer toutes les photos d'un utilisateur
  async getUserPhotos(userId) {
    const result = await pool.query(
      'SELECT id, url, is_profile, is_external, created_at FROM photos WHERE user_id = $1 ORDER BY id',
      [userId]
    );
    return result.rows;
  },

  // Récupérer une photo par son ID
  async findById(photoId, userId = null) {
    let query = 'SELECT id, url, is_profile, is_external, user_id FROM photos WHERE id = $1';
    const params = [photoId];
    
    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }
    
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },

  // Définir la photo de profil
  async setProfile(userId, photoId) {
    const photo = await this.findById(photoId, userId);
    if (!photo) {
      throw new Error('Photo non trouvée');
    }
    
    await pool.query(
      'UPDATE photos SET is_profile = false WHERE user_id = $1',
      [userId]
    );
    
    await pool.query(
      'UPDATE photos SET is_profile = true WHERE id = $1 AND user_id = $2',
      [photoId, userId]
    );
    
    return { success: true };
  },

  // Supprimer une photo
  async delete(photoId, userId) {
    const photo = await this.findById(photoId, userId);
    if (!photo) return null;
    
    await pool.query(
      'DELETE FROM photos WHERE id = $1 AND user_id = $2',
      [photoId, userId]
    );
    
    // Supprimer le fichier physique seulement si ce n'est pas une URL externe
    if (!photo.is_external && photo.url) {
      const filePath = path.join(__dirname, '../../', photo.url);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Erreur lors de la suppression du fichier ${filePath}:`, err);
        } else {
          console.log(`✅ Fichier supprimé: ${filePath}`);
        }
      });
    }
    
    // Si c'était la photo de profil, en promouvoir une autre
    if (photo.is_profile) {
      const remaining = await pool.query(
        'SELECT id FROM photos WHERE user_id = $1 ORDER BY id LIMIT 1',
        [userId]
      );
      
      if (remaining.rows.length > 0) {
        await pool.query(
          'UPDATE photos SET is_profile = true WHERE id = $1',
          [remaining.rows[0].id]
        );
      }
    }
    
    return photo;
  },

  // Compter les photos d'un utilisateur
  async count(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM photos WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
};

module.exports = photoModel;
