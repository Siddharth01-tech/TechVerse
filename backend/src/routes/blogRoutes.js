const router = require('express').Router();
const { protect, optional } = require('../middleware/auth');
const {
  getBlogs,
  getMyBlogs,
  getBlogById,
  getRelated,
  createBlog,
  updateBlog,
  toggleStatus,
  deleteBlog,
  toggleLike,
  toggleBookmark
} = require('../controllers/blogController');

router.get('/', getBlogs);
router.get('/mine', protect, getMyBlogs);
router.get('/:id', optional, getBlogById);
router.get('/:id/related', getRelated);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.patch('/:id/status', protect, toggleStatus);
router.delete('/:id', protect, deleteBlog);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/bookmark', protect, toggleBookmark);

module.exports = router;
