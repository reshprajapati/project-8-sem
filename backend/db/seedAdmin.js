require('dotenv').config();

const { initDB } = require('./init');
const User = require('./User');

/**
 * Creates the studio admin account. Admins cannot register through the public
 * form, so this is the only way to make the first one.
 *
 *   npm run seed:admin
 *
 * Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME in .env,
 * and fall back to the values below for local development.
 */
const seedAdmin = async () => {
  const name = process.env.ADMIN_NAME || 'Studio Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@studio.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  await initDB();

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`ℹ️  Admin already exists: ${email}`);
      return;
    }

    console.error(`❌ ${email} is already registered as a ${existing.role}. Choose a different ADMIN_EMAIL.`);
    process.exitCode = 1;
    return;
  }

  await User.create({ name, email, password, role: 'admin' });

  console.log('✅ Admin account created');
  console.log(`   email:    ${email}`);
  console.log(`   password: ${password}`);
  console.log('   Change the password in .env before deploying.');
};

seedAdmin()
  .then(() => process.exit(process.exitCode || 0))
  .catch(err => {
    console.error('❌ Could not seed the admin account:', err.message);
    process.exit(1);
  });
