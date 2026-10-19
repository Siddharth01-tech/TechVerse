const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  toggleUserStatus,
  updateUserRole,
  getBlogs,
  deleteBlog
} = require('../controllers/adminController');

// All admin routes require authentication and verified admin role
router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.get('/blogs', getBlogs);
router.delete('/blogs/:id', deleteBlog);

module.exports = router;
