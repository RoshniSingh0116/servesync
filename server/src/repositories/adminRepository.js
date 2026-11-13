'use strict';

/**
 * adminRepository.js — ServeSync (Member 3)
 *
 * All MongoDB read operations for the `admins` collection.
 * Uses the shared database connection provided by db.js via getDB().
 *
 * Design decisions:
 *  - getDB() is called inside each function (not at module load time) so
 *    these functions are only invoked after connectDB() has run in server.js.
 *    This matches the same pattern used by foodRepository, orderRepository,
 *    and kitchenRepository.
 *  - The `admins` collection is expected to hold documents with at minimum:
 *      { username: string, password: string }
 *    The `password` field may be a plain-text string or a bcrypt hash,
 *    depending on how the admin document was seeded.  Password comparison
 *    logic lives in the controller, not here.
 *  - We never return the password field to callers outside this module —
 *    all finders that return an admin document strip `password` before
 *    returning, except findAdminByUsernameWithPassword which is used
 *    exclusively by the login flow for the credential check.
 */

const { getDB } = require('../config/db');

/** @returns {import('mongodb').Collection} */
function adminsCollection() {
  return getDB().collection('admins');
}

/* ─── Read operations ─────────────────────────────────────────────────── */

/**
 * findAdminByUsername — looks up an admin document by username or email.
 * Uses case-insensitive regex matching to prevent case-mismatch issues.
 * Returns null when no matching document exists.
 *
 * NOTE: This version returns the full document INCLUDING the password field
 * so the login controller can compare the submitted password.
 * The controller is responsible for stripping the password before responding.
 *
 * @param {string} usernameOrEmail
 * @returns {Promise<object|null>}
 */
async function findAdminByUsername(usernameOrEmail) {
  const term = String(usernameOrEmail).trim();
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ciRegex = { $regex: new RegExp(`^${escaped}$`, 'i') };

  return adminsCollection().findOne({
    $or: [
      { username: ciRegex },
      { email: ciRegex },
    ],
  });
}

module.exports = {
  findAdminByUsername,
};
