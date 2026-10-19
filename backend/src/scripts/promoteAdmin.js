require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

async function promote() {
  const email = process.argv[2];

  if (!email) {
    console.error('\n[Usage] Please provide the user email to promote to admin:');
    console.error('Example: node src/scripts/promoteAdmin.js user@example.com\n');
    process.exit(1);
  }

  try {
    await connectDB();
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error(`\n[Error] No user found with email: ${normalizedEmail}\n`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`\n[Success] User "${user.name}" (${user.email}) has been successfully promoted to ADMIN!\n`);
    process.exit(0);
  } catch (error) {
    console.error('\n[Error] Failed to promote user:', error.message, '\n');
    process.exit(1);
  }
}

promote();
