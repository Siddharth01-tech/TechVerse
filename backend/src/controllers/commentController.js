const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Blog = require('../models/Blog');

exports.getCommentsByBlog = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.json([]);
    }
    const comments = await Comment.findByBlogId(req.params.id);
    res.json(comments);
  } catch (error) {
    console.error('getCommentsByBlog error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Write a comment first' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Article not found' });

    await new Promise(r => setTimeout(r, 60));

    const comment = await Comment.createComment({
      blogId: req.params.id,
      userId: req.userId,
      text
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('addComment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};
