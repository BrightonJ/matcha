const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/me', locationController.getMyLocation);
router.put('/gps', locationController.updateGpsLocation);
router.put('/manual', locationController.updateManualLocation);
router.delete('/me', locationController.disableLocation);

module.exports = router;