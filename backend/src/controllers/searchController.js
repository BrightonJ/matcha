const { search: searchModel, user: userModel } = require('../models');

const searchUsers = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    
    let preferredGenders = ['male', 'female', 'other'];
    if (user.sexual_preferences === 'male') {
      preferredGenders = ['male'];
    } else if (user.sexual_preferences === 'female') {
      preferredGenders = ['female'];
    }

    const filters = {
      ageMin: req.query.ageMin ? parseInt(req.query.ageMin) : null,
      ageMax: req.query.ageMax ? parseInt(req.query.ageMax) : null,
      preferences: preferredGenders,
      latitude: req.query.latitude ? parseFloat(req.query.latitude) : null,
      longitude: req.query.longitude ? parseFloat(req.query.longitude) : null,
      distance: req.query.distance ? parseFloat(req.query.distance) : null,
      popularityMin: req.query.popularityMin !== undefined && req.query.popularityMin !== '' ? parseFloat(req.query.popularityMin) : null,
      popularityMax: req.query.popularityMax !== undefined && req.query.popularityMax !== '' ? parseFloat(req.query.popularityMax) : null,
      tags: req.query.tags ? req.query.tags.split(',') : null,
      orderBy: req.query.orderBy || 'popularity_score',
      orderDirection: req.query.orderDirection || 'DESC',
      limit: req.query.limit ? Math.max(1, parseInt(req.query.limit)) : 20,
      offset: req.query.offset ? Math.max(0, parseInt(req.query.offset)) : 0
    };
    
    const users = await searchModel.searchUsers(filters, req.userId);
    
    res.json({
      users,
      filters,
      count: users.length
    });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const suggestions = await searchModel.getSuggestions(req.userId, limit, offset);
    
    res.json({
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { searchUsers, getSuggestions };