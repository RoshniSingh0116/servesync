'use strict';
require('dotenv').config();

const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'servesync';

if (!URI) {
  throw new Error(
    'Missing environment variable: MONGODB_URI. ' +
    'Create server/.env and set MONGODB_URI to your MongoDB connection string.'
  );
}

let client = null;
let db = null;

async function connectDB() {
  if (db) {
    return db;
  }

  client = new MongoClient(URI);
  await client.connect();

  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB — database: "${DB_NAME}"`);

  return db;
}

function getDB() {
  if (!db) {
    throw new Error(
      'Database not initialised. Call connectDB() before accessing getDB().'
    );
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed.');
  }
}

module.exports = { connectDB, getDB, closeDB };
