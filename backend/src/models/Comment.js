const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true
  }
}, {
  timestamps: true
});

const shape = (c) => ({
  id: c._id ? c._id.toString() : c.id,
  text: c.text,
  createdAt: c.createdAt,
  author: (c.user && typeof c.user === 'object') ? c.user.name : 'Anonymous'
});

commentSchema.statics.shape = shape;

commentSchema.statics.findByBlogId = async function (blogId) {
  if (!mongoose.Types.ObjectId.isValid(blogId)) return [];
  const comments = await this.find({ blog: blogId })
    .populate('user', 'name')
    .sort({ createdAt: -1, _id: -1 });

  return comments.map(shape);
};

commentSchema.statics.createComment = async function ({ blogId, userId, text }) {
  let comment = await this.create({
    blog: blogId,
    user: userId,
    text
  });

  comment = await comment.populate('user', 'name');
  return shape(comment);
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
