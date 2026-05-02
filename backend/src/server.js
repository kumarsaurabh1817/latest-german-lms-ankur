require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');
const UserModel = require('./models/userModel');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 5009;

const ensureAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Platform Admin';

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin seed');
    return;
  }

  const existing = await UserModel.findByEmail(adminEmail);
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  if (existing) {
    await UserModel.update(existing.id, {
      password: hashedPassword,
      role: 'admin',
      is_active: true,
      is_teacher_approved: true,
      name: existing.name || adminName,
    });
    console.log('Synced admin account from env');
    return;
  }

  await UserModel.create({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    is_teacher_approved: true,
  });
  console.log('Seeded initial admin account');
};

const startServer = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    client.release();

    await ensureAdminUser();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    process.exit(1);
  }
};

startServer();