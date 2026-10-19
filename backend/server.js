require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`TechVerse running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[Error] Port ${PORT} is already in use.`);
    console.error(`Close the process using port ${PORT} or run with a different port (e.g. set PORT=5001 && npm start).\n`);
    process.exit(1);
  }
});
