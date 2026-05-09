const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/:userId', blockController.blockUser);
router.delete('/:userId', blockController.unblockUser);
router.get('/check/:userId', blockController.checkBlock);
router.get('/', blockController.getBlockedUsers);

module.exports = router;
