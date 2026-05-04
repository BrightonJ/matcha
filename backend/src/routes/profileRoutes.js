const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Mon profil
router.get('/me', profileController.getMyProfile);
router.put('/me', profileController.updateProfile);

// Mes visiteurs
router.get('/visitors', profileController.getMyVisitors);

// Profil d'un autre utilisateur
router.get('/:id', profileController.getUserProfile);

module.exports = router;
