const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/:userId', likeController.addLike);
router.delete('/:userId', likeController.removeLike);
router.get('/received', likeController.getReceivedLikes);
router.get('/sent', likeController.getSentLikes);
router.get('/matches', likeController.getMatches);
router.get('/check/:userId', likeController.checkLike);

module.exports = router;
