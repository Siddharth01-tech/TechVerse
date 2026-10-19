const mongoose = require('mongoose');
const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalBlogs, publishedBlogs, draftBlogs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' })
    ]);

    res.json({
      totalUsers,
      activeUsers,
      totalBlogs,
      publishedBlogs,
      draftBlogs
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Failed to fetch platform metrics' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { q, role, status } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }

    if (q && q.trim()) {
      const regex = { $regex: q.trim(), $options: 'i' };
      filter.$or = [{ name: regex }, { email: regex }, { username: regex }];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    // Aggregate blog counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [totalBlogs, publishedBlogs] = await Promise.all([
          Blog.countDocuments({ author: u._id }),
          Blog.countDocuments({ author: u._id, status: 'published' })
        ]);

        return {
          id: u._id.toString(),
          name: u.name,
          username: u.username || '',
          email: u.email,
          role: u.role || 'user',
          isActive: u.isActive !== false,
          avatar: u.avatar || '',
          createdAt: u.createdAt,
          totalBlogs,
          publishedBlogs
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = user.isActive === false ? true : false;
    await user.save();

    res.json({
      id: user._id.toString(),
      isActive: user.isActive,
      message: user.isActive ? `Account for ${user.name} activated` : `Account for ${user.name} deactivated`
    });
  } catch (error) {
    console.error('toggleUserStatus error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'You cannot change your own admin role' });
    }

    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      id: user._id.toString(),
      role: user.role,
      message: `Role for ${user.name} updated to ${role}`
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const { q, category, status } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (q && q.trim()) {
      filter.title = { $regex: q.trim(), $options: 'i' };
    }

    const blogs = await Blog.find(filter)
      .populate('author', 'name username email')
      .sort({ createdAt: -1 });

    const formatted = blogs.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      category: b.category,
      cover: b.cover || '',
      status: b.status,
      likes: Array.isArray(b.likes) ? b.likes.length : 0,
      author: b.author?.name || 'Unknown Author',
      author_email: b.author?.email || '',
      author_username: b.author?.username || '',
      createdAt: b.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('getBlogs error:', error);
    res.status(500).json({ error: 'Failed to fetch admin articles' });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await Comment.deleteMany({ blog: blog._id });

    res.json({ message: 'Article removed by administrator' });
  } catch (error) {
    console.error('deleteBlog error:', error);
    res.status(500).json({ error: 'Failed to remove article' });
  }
};
