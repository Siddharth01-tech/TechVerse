const router = require('express').Router();
const multer = require('multer');
const { protect, optional } = require('../middleware/auth');
const upload = require('../middleware/upload');
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
  toggleBookmark,
  uploadBlogImage
} = require('../controllers/blogController');

// Multer upload wrapper for structured error handling
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image size cannot exceed 5MB' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

router.get('/', getBlogs);
router.get('/mine', protect, getMyBlogs);
router.post('/upload-image', protect, handleUpload, uploadBlogImage);
router.get('/:id', optional, getBlogById);
router.get('/:id/related', getRelated);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.patch('/:id/status', protect, toggleStatus);
router.delete('/:id', protect, deleteBlog);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/bookmark', protect, toggleBookmark);

module.exports = router;
