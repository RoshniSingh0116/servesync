'use strict';


const { getDB } = require('../config/db');

function adminsCollection() {
  return getDB().collection('admins');
}


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
