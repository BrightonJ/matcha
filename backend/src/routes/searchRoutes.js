const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', searchController.searchUsers);
router.get('/suggestions', searchController.getSuggestions);

module.exports = router;
