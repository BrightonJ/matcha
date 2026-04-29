const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Tous les tags
router.get('/', tagController.getAllTags);

// Mes tags
router.get('/me', tagController.getMyTags);
router.post('/me', tagController.addTag);
router.delete('/me/:tagName', tagController.removeTag);

// Tags d'un autre utilisateur
router.get('/user/:id', tagController.getUserTags);

module.exports = router;