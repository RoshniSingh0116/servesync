'use strict';

/**
 * seedAdmin.js — ServeSync
 *
 * Upserts the admin account in MongoDB using credentials from environment
 * variables. Passwords are stored as bcrypt hashes — NEVER as plain text.
 *
 * Usage:
 *   1. Set ADMIN_USERNAME and ADMIN_PASSWORD in server/.env
 *   2. Run:  node src/scripts/seedAdmin.js
 *
 * This script is IDEMPOTENT and safe to re-run:
 *   - Updates the existing admin account with the new username, email,
 *     and bcrypt-hashed password.
 *   - Creates an admin document if one does not exist yet.
 *   - Ensures stale/duplicate admin documents are purged so old credentials
 *     no longer work.
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB, closeDB, getDB } = require('../config/db');

/* ── Read credentials from environment variables ── */
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

    /* Hash the password from env — never store plain text */
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);

    /* Look for an existing admin account to update */
    let admin = await admins.findOne({ username: ADMIN_USERNAME });
    if (!admin) {
      admin = await admins.findOne({ role: 'admin' });
    }

    let adminId;
    if (admin) {
      /* Update the existing admin account */
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
      /* Insert a fresh admin document */
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

    /* Clean up any stale or duplicate admin records so old credentials cannot work */
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
