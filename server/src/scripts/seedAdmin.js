'use strict';

/**
 * seedAdmin.js — ServeSync (Member 3)
 *
 * One-time script to insert a default admin document into the `admins`
 * collection in MongoDB.  Run once during development setup:
 *
 *   node src/scripts/seedAdmin.js
 *
 * ⚠️  Security note:
 *   The password is stored as PLAIN TEXT here because bcryptjs is not yet
 *   installed.  This is acceptable for a local-only dev database.
 *   Before deploying to any shared or public environment:
 *     1. npm install bcryptjs
 *     2. Replace plain-text password with a bcrypt hash:
 *        const hash = await bcrypt.hash('your-password', 12);
 *     3. Update the document below to use `password: hash`.
 *
 * What this script does:
 *   - Connects to MongoDB using the shared db.js config.
 *   - Checks whether a document with username 'admin' already exists.
 *   - Inserts a default admin document only if it does not exist yet
 *     (idempotent — safe to re-run).
 *   - Closes the connection and exits.
 */

require('dotenv').config();

const { connectDB, closeDB, getDB } = require('../config/db');

const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',   // ⚠️ plain-text — replace with bcrypt hash before deployment
  role: 'admin',
  email: 'admin@servesync.com',
  createdAt: new Date(),
};

async function seedAdmin() {
  try {
    await connectDB();
    const db = getDB();
    const admins = db.collection('admins');

    /* Check for existing admin — do not create duplicates */
    const existing = await admins.findOne({ username: DEFAULT_ADMIN.username });

    if (existing) {
      console.log(
        `[seedAdmin] Admin user "${DEFAULT_ADMIN.username}" already exists — no changes made.`
      );
    } else {
      const result = await admins.insertOne(DEFAULT_ADMIN);
      console.log(
        `[seedAdmin] Admin user "${DEFAULT_ADMIN.username}" inserted with _id: ${result.insertedId}`
      );
    }
  } catch (err) {
    console.error('[seedAdmin] Error:', err.message);
    process.exit(1);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

seedAdmin();
