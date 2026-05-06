const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/:toUserId', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/unread', messageController.getUnreadCount);
router.get('/:userId', messageController.getConversation);

module.exports = router;
