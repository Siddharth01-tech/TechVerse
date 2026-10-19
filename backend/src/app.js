require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Static frontend serving
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Frontend HTML page routes
app.get(['/blogs', '/read-blogs', '/blogs.html'], (req, res) => {
  res.sendFile(path.join(frontendPath, 'blogs.html'));
});

app.get(['/my-blogs', '/my-blogs.html'], (req, res) => {
  res.sendFile(path.join(frontendPath, 'my-blogs.html'));
});

app.get(['/write', '/write.html'], (req, res) => {
  res.sendFile(path.join(frontendPath, 'write.html'));
});

app.get(['/blog', '/blog.html'], (req, res) => {
  res.sendFile(path.join(frontendPath, 'blog.html'));
});

app.get(['/profile', '/profile.html', '/dashboard', '/dashboard.html'], (req, res) => {
  res.sendFile(path.join(frontendPath, 'profile.html'));
});

app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

app.get(['/auth', '/auth.html'], (req, res) => {
  res.sendFile(path.join(frontendPath, 'auth.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports = app;
