const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getCommentsByBlog, addComment } = require('../controllers/commentController');

router.get('/blog/:id', getCommentsByBlog);
router.post('/blog/:id', protect, addComment);

module.exports = router;
