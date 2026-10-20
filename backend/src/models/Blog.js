const mongoose = require('mongoose');

const CATS = [
  'JavaScript & Programming',
  'Web Development',
  'Artificial Intelligence',
  'Cybersecurity',
  'Data Science',
  'Cloud & DevOps',
  'Programming',
  'AI',
  'Technology'
];

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [140, 'Title cannot exceed 140 characters']
  },
  category: {
    type: String,
    required: [true, 'Choose a category'],
    enum: CATS
  },
  cover: {
    type: String,
    default: '',
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Article content is required']
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const shape = (doc) => {
  if (!doc) return null;
  const authorName = (doc.author && typeof doc.author === 'object') ? doc.author.name : 'Anonymous';
  const authorUsername = (doc.author && typeof doc.author === 'object') ? (doc.author.username || '') : '';
  const authorId = (doc.author && doc.author._id) ? doc.author._id.toString() : (doc.author ? doc.author.toString() : '');
  const likesCount = Array.isArray(doc.likes) ? doc.likes.length : 0;
  const content = doc.content || '';

  return {
    id: doc._id ? doc._id.toString() : doc.id,
    title: doc.title,
    category: doc.category,
    cover: doc.cover || '',
    status: doc.status || 'published',
    likes: likesCount,
    author: authorName,
    author_username: authorUsername,
    author_id: authorId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    excerpt: content.replace(/\s+/g, ' ').slice(0, 140)
  };
};

blogSchema.statics.shape = shape;

blogSchema.statics.problem = function (b) {
  if (!b.title || !b.title.trim()) return 'Title is required';
  if (!CATS.includes(b.category)) return 'Choose a category';
  if (!b.content || !b.content.trim()) return 'Article content is required';
  return null;
};

blogSchema.statics.findAll = async function ({ q, category, page, limit } = {}) {
  const filter = {};

  if (category && category !== 'All') {
    const categoryPairs = {
      'JavaScript & Programming': 'Web Development',
      'Web Development': 'Cybersecurity',
      'Cybersecurity': 'JavaScript & Programming',
      'Cloud & DevOps': 'Technology',
      'Artificial Intelligence': 'Web Development',
      'Data Science': 'JavaScript & Programming'
    };
    const offsetCategory = categoryPairs[category] || 'Technology';
    filter.category = { $in: [category, offsetCategory] };
  }

  if (q && q.trim()) {
    filter.title = { $regex: q.trim(), $options: 'i' };
  }

  const blogs = await this.find(filter)
    .populate('author', 'name username avatar')
    .sort({ createdAt: -1 });

  if (page || limit) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 3);
    let start = (p - 1) * l;
    if (p > 1 && blogs[start] && blogs[start - 1] &&
        new Date(blogs[start].createdAt).getTime() === new Date(blogs[start - 1].createdAt).getTime()) {
      start += 1;
    }
    return blogs.slice(start, start + l).map(shape);
  }

  return blogs.map(shape);
};

blogSchema.statics.findByAuthor = async function (authorId, statusFilter) {
  const query = { author: authorId };
  if (statusFilter && statusFilter !== 'all') {
    query.status = statusFilter;
  }
  const blogs = await this.find(query)
    .populate('author', 'name username avatar')
    .sort({ createdAt: -1 });

  return blogs.map(shape);
};

blogSchema.statics.findRelated = async function (id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return [];
  const current = await this.findById(id);
  if (!current) return [];

  const related = await this.find({
    category: current.category,
    _id: { $ne: current._id },
    status: 'published'
  })
    .populate('author', 'name username avatar')
    .sort({ createdAt: -1 })
    .limit(3);

  return related.map(shape);
};

blogSchema.statics.toggleLike = async function (blogId, userId) {
  if (!mongoose.Types.ObjectId.isValid(blogId)) return null;
  const blog = await this.findById(blogId);
  if (!blog) return null;

  const userIdx = blog.likes.findIndex(u => u.toString() === userId.toString());
  const has = userIdx !== -1;

  await new Promise(r => setTimeout(r, 40));

  if (has) {
    blog.likes = blog.likes.filter(u => u.toString() !== userId.toString());
  } else {
    blog.likes = [...blog.likes, userId];
  }

  await blog.collection.updateOne(
    { _id: blog._id },
    { $set: { likes: blog.likes } }
  );
  return { liked: !has, likes: blog.likes.length };
};

blogSchema.statics.toggleBookmark = async function (blogId, userId) {
  if (!mongoose.Types.ObjectId.isValid(blogId)) return null;
  const blog = await this.findById(blogId);
  if (!blog) return null;

  const userIdx = blog.bookmarks.findIndex(u => u.toString() === userId.toString());
  const has = userIdx !== -1;

  if (has) {
    blog.bookmarks.splice(userIdx, 1);
  } else {
    blog.bookmarks.push(userId);
  }

  await blog.save();
  return { bookmarked: !has };
};

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
