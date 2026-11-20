'use strict';

const crypto = require('crypto');

let passed = 0;
let failed = 0;
const results = [];

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  FAIL: ${label}`);
    failed++;
    results.push(label);
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(64));
}

function mockReq({ params = {}, body = {}, query = {} } = {}) {
  return { params, body, query };
}

function mockRes() {
  return {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body)   { this._body  = body; return this; },
  };
}

function isValidObjectId(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

function timingSafeStringEqual(a, b) {
  try {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

const VALID_CATEGORIES = [
  'Starters',
  'Main Course',
  'Pizza',
  'Burgers',
  'Desserts',
  'Drinks',
];

const PROTECTED_FIELDS = ['_id', '__v', 'createdAt', 'updatedAt'];

let dbAdmins = [
  {
    _id: '671000000000000000000001',
    username: 'admin',
    password: 'admin123',
    email: 'admin@servesync.com',
    role: 'admin',
    createdAt: new Date(),
  },
];

let dbFoods = [
  {
    _id: '671000000000000000000010',
    name: 'Truffle Mushroom Crostini',
    description: 'Crisp sourdough with sautéed wild mushrooms',
    price: 280,
    category: 'Starters',
    image: 'https://example.com/crostini.jpg',
    isVeg: true,
    isPopular: true,
    isAvailable: true,
    createdAt: new Date('2026-10-20'),
    updatedAt: new Date('2026-10-20'),
  },
  {
    _id: '671000000000000000000011',
    name: 'Smoky Tandoori Chicken Tikka',
    description: 'Tender chicken morsels in spiced yogurt',
    price: 360,
    category: 'Starters',
    image: 'https://example.com/tikka.jpg',
    isVeg: false,
    isPopular: true,
    isAvailable: true,
    createdAt: new Date('2026-10-20'),
    updatedAt: new Date('2026-10-20'),
  },
  {
    _id: '671000000000000000000012',
    name: 'Seasonal Berry Tart',
    description: 'Fresh seasonal berries in almond pastry',
    price: 220,
    category: 'Desserts',
    image: '',
    isVeg: true,
    isPopular: false,
    isAvailable: false,
    createdAt: new Date('2026-10-20'),
    updatedAt: new Date('2026-10-20'),
  },
];

let dbOrders = [
  {
    _id: '671000000000000000000101',
    tableNumber: 3,
    items: [
      { foodId: '671000000000000000000010', name: 'Truffle Mushroom Crostini', price: 280, quantity: 2 },
    ],
    totalAmount: 560,
    total: 560,
    status: 'Pending',
    createdAt: new Date('2026-11-14T10:00:00Z'),
    updatedAt: new Date('2026-11-14T10:00:00Z'),
  },
  {
    _id: '671000000000000000000102',
    tableNumber: 5,
    items: [
      { foodId: '671000000000000000000011', name: 'Smoky Tandoori Chicken Tikka', price: 360, quantity: 1 },
    ],
    totalAmount: 360,
    total: 360,
    status: 'Preparing',
    createdAt: new Date('2026-11-14T10:15:00Z'),
    updatedAt: new Date('2026-11-14T10:20:00Z'),
  },
  {
    _id: '671000000000000000000103',
    tableNumber: 2,
    items: [
      { foodId: '671000000000000000000010', name: 'Truffle Mushroom Crostini', price: 280, quantity: 1 },
    ],
    totalAmount: 280,
    total: 280,
    status: 'Ready',
    createdAt: new Date('2026-11-14T10:05:00Z'),
    updatedAt: new Date('2026-11-14T10:25:00Z'),
  },
  {
    _id: '671000000000000000000104',
    tableNumber: 1,
    items: [
      { foodId: '671000000000000000000011', name: 'Smoky Tandoori Chicken Tikka', price: 360, quantity: 2 },
    ],
    totalAmount: 720,
    total: 720,
    status: 'Served',
    createdAt: new Date('2026-11-14T09:30:00Z'),
    updatedAt: new Date('2026-11-14T10:10:00Z'),
  },
];


async function stubFindAdmin(usernameOrEmail) {
  const term = String(usernameOrEmail).trim();
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ciRegex = new RegExp(`^${escaped}$`, 'i');

  return dbAdmins.find(
    (a) => ciRegex.test(a.username) || ciRegex.test(a.email)
  ) || null;
}

async function stubAdminLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || String(username).trim() === '') {
      return res.status(400).json({ error: 'username is required.' });
    }
    if (!password || String(password).trim() === '') {
      return res.status(400).json({ error: 'password is required.' });
    }

    let admin = await stubFindAdmin(String(username).trim());

    if (!admin && dbAdmins.length === 0) {
      const defaultAdmin = {
        _id: '671000000000000000000001',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        email: 'admin@servesync.com',
        createdAt: new Date(),
      };
      dbAdmins.push(defaultAdmin);
      const term = String(username).trim().toLowerCase();
      if (term === 'admin' || term === 'admin@servesync.com') {
        admin = defaultAdmin;
      }
    }

    const credentialsValid =
      admin !== null &&
      (timingSafeStringEqual(admin.password, String(password)) ||
        timingSafeStringEqual(String(admin.password).trim(), String(password).trim()));

    if (!credentialsValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const { password: _pw, ...safeAdmin } = admin;

    return res.status(200).json({
      message: 'Login successful.',
      token,
      admin: safeAdmin,
    });
  } catch {
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

async function stubAdminGetFoods(req, res) {
  return res.status(200).json({
    count: dbFoods.length,
    foods: [...dbFoods],
  });
}

async function stubAdminGetOrders(req, res) {
  const sorted = [...dbOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const mapped = sorted.map((o) => ({
    ...o,
    total: o.total !== undefined ? o.total : o.totalAmount,
    totalAmount: o.totalAmount !== undefined ? o.totalAmount : o.total,
  }));
  return res.status(200).json({
    count: mapped.length,
    orders: mapped,
  });
}

async function stubAdminGetDashboard(req, res) {
  const totalFoods = dbFoods.length;
  const availableFoods = dbFoods.filter((f) => f.isAvailable !== false).length;
  const unavailableFoods = totalFoods - availableFoods;
  const totalOrders = dbOrders.length;
  const pendingOrders = dbOrders.filter((o) => ['Pending', 'pending'].includes(o.status)).length;
  const preparingOrders = dbOrders.filter((o) => ['Preparing', 'preparing'].includes(o.status)).length;
  const readyOrders = dbOrders.filter((o) => ['Ready', 'ready'].includes(o.status)).length;
  const completedOrders = dbOrders.filter((o) =>
    ['Served', 'served', 'Completed', 'completed'].includes(o.status)
  ).length;

  return res.status(200).json({
    totalFoods,
    totalFoodItems: totalFoods,
    availableFoods,
    unavailableFoods,
    totalOrders,
    pendingOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    servedOrders: completedOrders,
  });
}

async function stubAddFood(req, res) {
  const { name, description, price, category, image, isVeg, isPopular, isAvailable } = req.body || {};
  if (!name || String(name).trim() === '') return res.status(400).json({ error: 'name is required.' });
  if (!description || String(description).trim() === '') return res.status(400).json({ error: 'description is required.' });
  if (price === undefined || price === null || price === '') return res.status(400).json({ error: 'price is required.' });
  const parsedPrice = Number(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) return res.status(400).json({ error: 'price must be a positive number.' });
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `"${category}" is not a valid category.`, validCategories: VALID_CATEGORIES });
  }

  const newDoc = {
    _id: `67100000000000000000009${dbFoods.length + 1}`,
    name: String(name).trim(),
    description: String(description).trim(),
    price: parsedPrice,
    category,
    image: image ? String(image).trim() : '',
    isVeg: Boolean(isVeg),
    isPopular: Boolean(isPopular),
    isAvailable: isAvailable !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  dbFoods.push(newDoc);
  return res.status(201).json({ message: 'Food item added successfully.', food: newDoc });
}

async function stubUpdateFood(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid food ID format.' });

  const attemptedProtected = PROTECTED_FIELDS.filter((f) => req.body[f] !== undefined);
  if (attemptedProtected.length > 0) {
    return res.status(400).json({ error: `The following fields cannot be updated: ${attemptedProtected.join(', ')}.` });
  }

  const existing = dbFoods.find((f) => f._id === id);
  if (!existing) return res.status(404).json({ error: 'Food item not found.' });

  const updates = { ...req.body };
  if (updates.price !== undefined) {
    const p = Number(updates.price);
    if (isNaN(p) || p <= 0) return res.status(400).json({ error: 'price must be a positive number.' });
    updates.price = p;
  }
  if (updates.category !== undefined && !VALID_CATEGORIES.includes(updates.category)) {
    return res.status(400).json({ error: 'invalid category' });
  }

  Object.assign(existing, updates, { updatedAt: new Date() });
  return res.status(200).json({ message: 'Food item updated successfully.', food: existing });
}

async function stubDeleteFood(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid food ID format.' });

  const idx = dbFoods.findIndex((f) => f._id === id);
  if (idx === -1) return res.status(404).json({ error: 'Food item not found.' });

  dbFoods.splice(idx, 1);
  return res.status(200).json({ message: 'Food item deleted successfully.', deletedId: id });
}

async function runTests() {
  section('TASK 1: ADMIN AUTHENTICATION TESTS');

  {
    const req = mockReq({ body: { username: 'admin', password: 'admin123' } });
    const res = mockRes();
    await stubAdminLogin(req, res);
    assert('Valid login with username returns 200', res._status === 200);
    assert('Login response contains session token (64 hex chars)', typeof res._body.token === 'string' && res._body.token.length === 64);
    assert('Login response returns safe admin object', res._body.admin && res._body.admin.username === 'admin');
    assert('Password is NEVER returned in response', res._body.admin.password === undefined);
  }

  {
    const req = mockReq({ body: { username: 'admin@servesync.com', password: 'admin123' } });
    const res = mockRes();
    await stubAdminLogin(req, res);
    assert('Valid login with email returns 200', res._status === 200);
    assert('Login with email returns admin user', res._body.admin && res._body.admin.email === 'admin@servesync.com');
  }

  {
    const req = mockReq({ body: { username: 'ADMIN', password: 'admin123' } });
    const res = mockRes();
    await stubAdminLogin(req, res);
    assert('Case-insensitive username login returns 200', res._status === 200);
  }

  {
    const req = mockReq({ body: { username: 'admin', password: 'wrongpassword' } });
    const res = mockRes();
    await stubAdminLogin(req, res);
    assert('Invalid password returns 401', res._status === 401);
    assert('Invalid password returns generic error message', res._body.error === 'Invalid username or password.');
  }

  {
    const req = mockReq({ body: { username: 'nonexistent_user', password: 'admin123' } });
    const res = mockRes();
    await stubAdminLogin(req, res);
    assert('Non-existent user returns 401 (preventing user enumeration)', res._status === 401);
    assert('Returns same generic error as invalid password', res._body.error === 'Invalid username or password.');
  }

  {
    const req = mockReq({ body: { username: '', password: 'admin123' } });
    const res = mockRes();
    await stubAdminLogin(req, res);
    assert('Missing username returns 400', res._status === 400);
    assert('Returns descriptive error for missing username', res._body.error.includes('username is required'));
  }

  {
    const req = mockReq({ body: { username: 'admin', password: '' } });
    const res = mockRes();
    await stubAdminLogin(req, res);
    assert('Missing password returns 400', res._status === 400);
    assert('Returns descriptive error for missing password', res._body.error.includes('password is required'));
  }

  {
    const savedAdmins = [...dbAdmins];
    dbAdmins = [];
    const req = mockReq({ body: { username: 'admin', password: 'admin123' } });
    const res = mockRes();
    await stubAdminLogin(req, res);
    assert('Auto-seed initializes default admin when collection is empty', res._status === 200);
    assert('Database now contains seeded admin', dbAdmins.length === 1 && dbAdmins[0].username === 'admin');
    dbAdmins = savedAdmins;
  }

  section('TASK 2: FOOD MANAGEMENT TESTS');

  {
    const req = mockReq();
    const res = mockRes();
    await stubAdminGetFoods(req, res);
    assert('adminGetFoods returns 200', res._status === 200);
    assert('adminGetFoods returns count matching database', res._body.count === dbFoods.length);
    assert('adminGetFoods returns array of food items', Array.isArray(res._body.foods));
  }

  let addedFoodId = null;
  {
    const req = mockReq({
      body: {
        name: 'Kashmiri Rogan Josh',
        description: 'Slow-cooked aromatic lamb in Kashmiri chili gravy',
        price: 490,
        category: 'Main Course',
        isVeg: false,
        isPopular: true,
        isAvailable: true,
      },
    });
    const res = mockRes();
    await stubAddFood(req, res);
    assert('Add food returns 201 Created', res._status === 201);
    assert('Response contains created food object with _id', res._body.food && isValidObjectId(res._body.food._id));
    assert('Food is persisted in database', dbFoods.some((f) => f.name === 'Kashmiri Rogan Josh'));
    addedFoodId = res._body.food._id;
  }

  {
    const req = mockReq({ body: { name: '', price: 200, category: 'Main Course' } });
    const res = mockRes();
    await stubAddFood(req, res);
    assert('Missing name is rejected with 400', res._status === 400);
  }

  {
    const req = mockReq({
      body: { name: 'Pasta', description: 'Italian pasta', price: 200, category: 'ItalianFood' },
    });
    const res = mockRes();
    await stubAddFood(req, res);
    assert('Invalid category is rejected with 400 and valid categories list', res._status === 400 && res._body.validCategories);
  }

  {
    const req = mockReq({
      body: { name: 'Chai', description: 'Masala tea', price: -50, category: 'Drinks' },
    });
    const res = mockRes();
    await stubAddFood(req, res);
    assert('Negative price is rejected with 400', res._status === 400);
  }

  {
    const req = mockReq({
      params: { id: addedFoodId },
      body: { price: 520, isAvailable: false },
    });
    const res = mockRes();
    await stubUpdateFood(req, res);
    assert('Edit food item returns 200', res._status === 200);
    const updated = dbFoods.find((f) => f._id === addedFoodId);
    assert('Updated price reflects in database', updated.price === 520);
    assert('Updated isAvailable reflects in database', updated.isAvailable === false);
  }

  {
    const req = mockReq({
      params: { id: addedFoodId },
      body: { _id: '671000000000000000000999', name: 'New Name' },
    });
    const res = mockRes();
    await stubUpdateFood(req, res);
    assert('Attempt to overwrite _id is rejected with 400', res._status === 400);
  }

  {
    const req = mockReq({
      params: { id: 'invalid-id-123' },
      body: { price: 100 },
    });
    const res = mockRes();
    await stubUpdateFood(req, res);
    assert('Invalid ObjectId format in PUT returns 400', res._status === 400);
  }

  {
    const req = mockReq({
      params: { id: '671000000000000000000999' },
      body: { price: 100 },
    });
    const res = mockRes();
    await stubUpdateFood(req, res);
    assert('Non-existent food ID in PUT returns 404', res._status === 404);
  }

  {
    const req = mockReq({ params: { id: addedFoodId } });
    const res = mockRes();
    await stubDeleteFood(req, res);
    assert('Delete food item returns 200', res._status === 200);
    assert('Deleted food is removed from database', !dbFoods.some((f) => f._id === addedFoodId));
  }

  {
    const req = mockReq({ params: { id: 'not-valid' } });
    const res = mockRes();
    await stubDeleteFood(req, res);
    assert('Invalid ObjectId format in DELETE returns 400', res._status === 400);
  }

  {
    const req = mockReq({ params: { id: '671000000000000000000999' } });
    const res = mockRes();
    await stubDeleteFood(req, res);
    assert('Non-existent food ID in DELETE returns 404', res._status === 404);
  }

  section('TASK 3: ORDER MANAGEMENT TESTS');

  {
    const req = mockReq();
    const res = mockRes();
    await stubAdminGetOrders(req, res);
    assert('adminGetOrders returns 200', res._status === 200);
    assert('adminGetOrders returns count matching database', res._body.count === dbOrders.length);
    assert('Orders contain tableNumber', res._body.orders.every((o) => typeof o.tableNumber === 'number'));
    assert('Orders contain items array', res._body.orders.every((o) => Array.isArray(o.items) && o.items.length > 0));
    assert('Orders normalize total and totalAmount', res._body.orders.every((o) => o.total !== undefined && o.totalAmount !== undefined));
    assert('Orders contain valid status', res._body.orders.every((o) => ['Pending', 'Preparing', 'Ready', 'Served'].includes(o.status)));
    assert('Orders contain creation timestamp', res._body.orders.every((o) => o.createdAt));
  }

  {
    const savedOrders = [...dbOrders];
    dbOrders = [];
    const req = mockReq();
    const res = mockRes();
    await stubAdminGetOrders(req, res);
    assert('Empty orders collection returns 200 with count 0', res._status === 200 && res._body.count === 0 && res._body.orders.length === 0);
    dbOrders = savedOrders;
  }

  section('TASK 4: DASHBOARD STATISTICS TESTS');

  {
    const req = mockReq();
    const res = mockRes();
    await stubAdminGetDashboard(req, res);
    assert('adminGetDashboard returns 200', res._status === 200);
    assert('totalFoods matches dbFoods.length (3 items)', res._body.totalFoods === 3);
    assert('availableFoods matches active items (2 items)', res._body.availableFoods === 2);
    assert('unavailableFoods matches inactive items (1 item)', res._body.unavailableFoods === 1);
    assert('totalOrders matches dbOrders.length (4 orders)', res._body.totalOrders === 4);
    assert('pendingOrders matches Pending orders (1 order)', res._body.pendingOrders === 1);
    assert('preparingOrders matches Preparing orders (1 order)', res._body.preparingOrders === 1);
    assert('readyOrders matches Ready orders (1 order)', res._body.readyOrders === 1);
    assert('completedOrders matches Served orders (1 order)', res._body.completedOrders === 1);
  }

  section('TASK 5 & 6: INTEGRATION & LIFECYCLE PROGRESSION TESTS');

  {
    const order101 = dbOrders.find((o) => o._id === '671000000000000000000101');
    order101.status = 'Preparing';

    const req = mockReq();
    const res = mockRes();
    await stubAdminGetDashboard(req, res);
    assert('Pending count decremented to 0 after kitchen update', res._body.pendingOrders === 0);
    assert('Preparing count incremented to 2 after kitchen update', res._body.preparingOrders === 2);

    order101.status = 'Ready';
    const res2 = mockRes();
    await stubAdminGetDashboard(req, res2);
    assert('Ready count incremented to 2', res2._body.readyOrders === 2);

    order101.status = 'Served';
    const res3 = mockRes();
    await stubAdminGetDashboard(req, res3);
    assert('Completed count incremented to 2', res3._body.completedOrders === 2);
  }

  {
    const newOrder = {
      _id: '671000000000000000000105',
      tableNumber: 4,
      items: [
        { foodId: '671000000000000000000010', name: 'Truffle Mushroom Crostini', price: 280, quantity: 3 },
      ],
      totalAmount: 840,
      total: 840,
      status: 'Pending',
      createdAt: new Date(),
    };
    dbOrders.push(newOrder);

    const req = mockReq();
    const res = mockRes();
    await stubAdminGetDashboard(req, res);
    assert('New order increments totalOrders to 5', res._body.totalOrders === 5);
    assert('New order increments pendingOrders to 1', res._body.pendingOrders === 1);

    const ordersRes = mockRes();
    await stubAdminGetOrders(req, ordersRes);
    assert('New order immediately appears in admin orders list', ordersRes._body.orders.some((o) => o._id === '671000000000000000000105'));
  }

  {
    const addReq = mockReq({
      body: {
        name: 'Gulab Jamun with Rabri',
        description: 'Warm cottage cheese dumplings in cardamom saffron milk',
        price: 180,
        category: 'Desserts',
        isVeg: true,
        isPopular: true,
        isAvailable: true,
      },
    });
    const addRes = mockRes();
    await stubAddFood(addReq, addRes);
    assert('Admin adds new item to catalog', addRes._status === 201);

    const menuFoods = dbFoods.filter((f) => f.isAvailable !== false);
    assert('Customer menu immediately sees new available item', menuFoods.some((f) => f.name === 'Gulab Jamun with Rabri'));
  }

  console.log(`\n${'═'.repeat(64)}`);
  console.log(`  MEMBER 3 COMMIT 6 TEST RUN SUMMARY`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`${'═'.repeat(64)}\n`);

  if (failed > 0) {
    console.error('Failed test cases:', results);
    process.exit(1);
  }
}

runTests();
