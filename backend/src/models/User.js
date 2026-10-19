const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: '',
    trim: true
  },
  bio: {
    type: String,
    default: '',
    trim: true,
    maxlength: [250, 'Bio cannot exceed 250 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findByEmail = function(email) {
  if (!email) return null;
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.existsByEmail = async function(email) {
  if (!email) return false;
  const count = await this.countDocuments({ email: email.toLowerCase().trim() });
  return count > 0;
};

userSchema.statics.existsByUsername = async function(username) {
  if (!username) return false;
  const count = await this.countDocuments({ username: username.toLowerCase().trim() });
  return count > 0;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
