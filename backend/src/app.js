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
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'TechVerse backend is running' }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Static uploads serving
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Root status endpoint for pure API backend
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TechVerse API Server Running',
    endpoints: {
      health: '/api/health',
      blogs: '/api/blogs',
      auth: '/api/auth'
    }
  });
});

module.exports = app;
