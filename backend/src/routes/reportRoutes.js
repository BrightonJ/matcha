const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/:userId', reportController.reportUser);

module.exports = router;