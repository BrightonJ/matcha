const { location: locationModel } = require('../models');

// Obtenir ma localisation actuelle
const getMyLocation = async (req, res) => {
  try {
    const location = await locationModel.getUserLocation(req.userId);
    res.json(location);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour la localisation GPS
const updateGpsLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    // Validation
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude et longitude sont requis' });
    }
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude et longitude doivent être des nombres' });
    }
    
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'latitude doit être comprise entre -90 et 90' });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'longitude doit être comprise entre -180 et 180' });
    }
    
    const updated = await locationModel.updateGpsLocation(req.userId, latitude, longitude);
    
    res.json({
      message: 'Localisation GPS mise à jour',
      location: updated
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour la localisation manuelle (ville/quartier)
const updateManualLocation = async (req, res) => {
  try {
    const { city } = req.body;
    
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return res.status(400).json({ error: 'Une ville ou quartier valide est requis' });
    }
    
    const updated = await locationModel.updateManualLocation(req.userId, city.trim());
    
    res.json({
      message: 'Localisation manuelle mise à jour',
      location: updated
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Désactiver la localisation
const disableLocation = async (req, res) => {
  try {
    const updated = await locationModel.disableLocation(req.userId);
    
    res.json({
      message: 'Localisation désactivée',
      location: updated
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getMyLocation, updateGpsLocation, updateManualLocation, disableLocation };