'use strict';


require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB, closeDB, getDB } = require('../config/db');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || 'admin@servesync.com';

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error(
    '[seedAdmin] ❌ ADMIN_USERNAME and ADMIN_PASSWORD must be set in server/.env\n' +
    '           Configure them and re-run this script.'
  );
  process.exit(1);
}

const BCRYPT_SALT_ROUNDS = 12;

async function seedAdmin() {
  try {
    await connectDB();
    const db     = getDB();
    const admins = db.collection('admins');

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);

    let admin = await admins.findOne({ username: ADMIN_USERNAME });
    if (!admin) {
      admin = await admins.findOne({ role: 'admin' });
    }

    let adminId;
    if (admin) {
      adminId = admin._id;
      await admins.updateOne(
        { _id: adminId },
        {
          $set: {
            username:  ADMIN_USERNAME,
            password:  hashedPassword,
            email:     ADMIN_EMAIL,
            role:      'admin',
            updatedAt: new Date(),
          },
        }
      );
      console.log(
        `[seedAdmin] ✅ Existing admin account updated to username "${ADMIN_USERNAME}" with bcrypt password hash.`
      );
    } else {
      const result = await admins.insertOne({
        username:  ADMIN_USERNAME,
        password:  hashedPassword,
        role:      'admin',
        email:     ADMIN_EMAIL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      adminId = result.insertedId;
      console.log(
        `[seedAdmin] ✅ Admin account "${ADMIN_USERNAME}" created with _id: ${adminId}`
      );
    }

    const staleResult = await admins.deleteMany({
      _id: { $ne: adminId },
    });
    if (staleResult.deletedCount > 0) {
      console.log(
        `[seedAdmin] 🧹 Purged ${staleResult.deletedCount} old/duplicate admin record(s).`
      );
    }

    console.log('[seedAdmin] 🎉 Admin credentials successfully updated.');
  } catch (err) {
    console.error('[seedAdmin] ❌ Error:', err.message);
    process.exit(1);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

seedAdmin();
