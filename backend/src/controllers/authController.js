const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Blog = require('../models/Blog');
const { SECRET } = require('../middleware/auth');

const shapeUser = (u) => ({
  id: u._id.toString(),
  name: u.name,
  username: u.username || u.name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
  email: u.email,
  role: u.role || 'user',
  avatar: u.avatar || '',
  bio: u.bio || '',
  createdAt: u.createdAt
});

const reply = (u) => ({
  token: jwt.sign({ id: u._id.toString() }, SECRET, { expiresIn: '7d' }),
  user: shapeUser(u)
});

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let { username } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email || email.length < 3) return res.status(400).json({ error: 'Enter a valid email address' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Determine or validate username
    if (username && username.trim()) {
      username = username.toLowerCase().trim();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return res.status(400).json({ error: 'Username must be 3-30 characters and only contain letters, numbers, and underscores' });
      }
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
      }
    } else {
      // Auto-generate safe username from name or email
      let base = (name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')).slice(0, 20);
      if (base.length < 3) base = 'user_' + Math.floor(1000 + Math.random() * 9000);
      let candidate = base;
      let counter = 1;
      while (await User.existsByUsername(candidate)) {
        candidate = `${base}${counter}`;
        counter++;
      }
      username = candidate;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Enforce role: 'user' and isActive: true unconditionally for public signups
    const user = await User.create({
      name: name.trim(),
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
      isActive: true
    });

    res.status(201).json(reply(user));
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    res.json(reply(user));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [totalBlogs, publishedBlogs, draftBlogs, recentBlogs] = await Promise.all([
      Blog.countDocuments({ author: user._id }),
      Blog.countDocuments({ author: user._id, status: 'published' }),
      Blog.countDocuments({ author: user._id, status: 'draft' }),
      Blog.find({ author: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('author', 'name username avatar')
    ]);

    res.json({
      user: shapeUser(user),
      stats: {
        totalBlogs,
        publishedBlogs,
        draftBlogs
      },
      recentBlogs: recentBlogs.map(Blog.shape)
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, username, bio, avatar } = req.body;

    if (name !== undefined) {
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
      user.name = name.trim();
    }

    if (username !== undefined && username.trim() !== '') {
      const cleanUsername = username.toLowerCase().trim();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({ error: 'Username must be 3-30 characters and only contain letters, numbers, and underscores' });
      }
      if (cleanUsername !== user.username) {
        const taken = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
        if (taken) {
          return res.status(409).json({ error: 'This username is already taken' });
        }
        user.username = cleanUsername;
      }
    }

    if (bio !== undefined) {
      user.bio = (bio || '').trim().slice(0, 250);
    }

    if (avatar !== undefined) {
      user.avatar = (avatar || '').trim();
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: shapeUser(user)
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
