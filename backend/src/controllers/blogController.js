const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

exports.getBlogs = async (req, res) => {
  try {
    const { q, category } = req.query;
    const blogs = await Blog.findAll({ q, category });
    res.json(blogs);
  } catch (error) {
    console.error('getBlogs error:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

exports.getMyBlogs = async (req, res) => {
  try {
    const { status } = req.query;
    const blogs = await Blog.findByAuthor(req.userId, status);
    res.json(blogs);
  } catch (error) {
    console.error('getMyBlogs error:', error);
    res.status(500).json({ error: 'Failed to fetch your articles' });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const b = await Blog.findById(req.params.id).populate('author', 'name username avatar');
    if (!b) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const authorId = (b.author && b.author._id) ? b.author._id.toString() : (b.author ? b.author.toString() : '');
    const isOwner = !!(req.userId && authorId === req.userId);
    const isAdmin = !!(req.user && req.user.role === 'admin');

    // Drafts are only accessible to their author or platform administrators
    if (b.status === 'draft' && !isOwner && !isAdmin) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const liked = !!(req.userId && Array.isArray(b.likes) && b.likes.some(u => u.toString() === req.userId));
    const bookmarked = !!(req.userId && Array.isArray(b.bookmarks) && b.bookmarks.some(u => u.toString() === req.userId));

    res.json({
      ...Blog.shape(b),
      content: b.content,
      liked,
      bookmarked,
      isOwner: isOwner || isAdmin
    });
  } catch (error) {
    console.error('getBlogById error:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

exports.getRelated = async (req, res) => {
  try {
    const related = await Blog.findRelated(req.params.id);
    res.json(related);
  } catch (error) {
    console.error('getRelated error:', error);
    res.status(500).json({ error: 'Failed to fetch related articles' });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const err = Blog.problem(req.body);
    if (err) return res.status(400).json({ error: err });

    const { title, category, content, cover, status } = req.body;
    const blog = await Blog.create({
      author: req.userId,
      title: title.trim(),
      category,
      cover: (cover || '').trim(),
      content,
      status: status === 'draft' ? 'draft' : 'published'
    });

    res.status(201).json({ id: blog._id.toString() });
  } catch (error) {
    console.error('createBlog error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const b = await Blog.findById(req.params.id);
    if (!b) return res.status(404).json({ error: 'Article not found' });

    const authorId = b.author ? b.author.toString() : '';
    const isOwner = authorId === req.userId;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only edit your own articles' });
    }

    const err = Blog.problem(req.body);
    if (err) return res.status(400).json({ error: err });

    const { title, category, content, cover, status } = req.body;
    b.title = title.trim();
    b.category = category;
    b.cover = (cover || '').trim();
    b.content = content;
    if (status === 'draft' || status === 'published') {
      b.status = status;
    }

    await b.save();
    res.json({ id: b._id.toString() });
  } catch (error) {
    console.error('updateBlog error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const b = await Blog.findById(req.params.id);
    if (!b) return res.status(404).json({ error: 'Article not found' });

    const authorId = b.author ? b.author.toString() : '';
    const isOwner = authorId === req.userId;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only manage your own articles' });
    }

    b.status = b.status === 'published' ? 'draft' : 'published';
    await b.save();

    res.json({
      id: b._id.toString(),
      status: b.status,
      message: b.status === 'published' ? 'Article published' : 'Article unpublished to draft'
    });
  } catch (error) {
    console.error('toggleStatus error:', error);
    res.status(500).json({ error: 'Failed to update article status' });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const b = await Blog.findById(req.params.id);
    if (!b) return res.status(404).json({ error: 'Article not found' });

    const authorId = b.author ? b.author.toString() : '';
    const isOwner = authorId === req.userId;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own articles' });
    }

    await Blog.findByIdAndDelete(b._id);
    await Comment.deleteMany({ blog: b._id });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('deleteBlog error:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const result = await Blog.toggleLike(req.params.id, req.userId);
    if (!result) return res.status(404).json({ error: 'Article not found' });

    res.json(result);
  } catch (error) {
    console.error('toggleLike error:', error);
    res.status(500).json({ error: 'Failed to update like' });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const result = await Blog.toggleBookmark(req.params.id, req.userId);
    if (!result) return res.status(404).json({ error: 'Article not found' });

    res.json(result);
  } catch (error) {
    console.error('toggleBookmark error:', error);
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
};
