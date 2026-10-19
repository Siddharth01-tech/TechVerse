const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET = process.env.JWT_SECRET || 'teachverse-dev-secret-key-2026';

function readToken(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(h.slice(7), SECRET).id;
  } catch {
    return null;
  }
}

exports.SECRET = SECRET;

exports.protect = async (req, res, next) => {
  const id = readToken(req);
  if (!id) {
    return res.status(401).json({ error: 'Please log in to continue' });
  }

  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please log in again.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact an administrator.' });
    }

    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

exports.optional = async (req, res, next) => {
  const id = readToken(req);
  if (id) {
    try {
      const user = await User.findById(id).select('-password');
      if (user && user.isActive !== false) {
        req.userId = user._id.toString();
        req.user = user;
      }
    } catch {}
  }
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
  }
  next();
};
