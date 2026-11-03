/**
 * ServeSync Mock Orders Data — Kitchen Dashboard (Phase 1 / Member 4)
 *
 * Compatible with future checkout structure from Member 2:
 * {
 *   id: 101,
 *   tableNumber: 5,
 *   items: [
 *     { foodId: 'item-1', name: 'Paneer Pizza', price: 249, quantity: 2 }
 *   ],
 *   total: 498,
 *   status: 'Pending', // 'Pending' | 'Preparing' | 'Ready' | 'Served'
 *   createdAt: '2026-10-25T21:20:00.000Z',
 *   specialInstructions: '...'
 * }
 */

export const ORDER_STATUSES = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
};

export const STATUS_TRANSITIONS = {
  Pending: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Served',
  Served: null, // End of workflow
};

/**
 * Exact badge colors as specified in ServeSync Design System:
 * - Pending:   bg #F6E7C3, text #79520C
 * - Preparing: bg #DCE8F8, text #234D83
 * - Ready:     bg #DCEFE0, text #24543A
 * - Served:    bg #E5E7E5, text #37413A
 */
export const STATUS_BADGE_STYLES = {
  Pending: {
    bg: '#F6E7C3',
    text: '#79520C',
    border: '#E5C98A',
    label: 'Pending',
  },
  Preparing: {
    bg: '#DCE8F8',
    text: '#234D83',
    border: '#B3CEEE',
    label: 'Preparing',
  },
  Ready: {
    bg: '#DCEFE0',
    text: '#24543A',
    border: '#A8D5B1',
    label: 'Ready',
  },
  Served: {
    bg: '#E5E7E5',
    text: '#37413A',
    border: '#C7CBC7',
    label: 'Served',
  },
};

/**
 * Realistic sample orders spanning all 4 lifecycle states.
 * Uses items from the actual restaurant menu (MENU_ITEMS in mockData.js).
 */
export const INITIAL_MOCK_ORDERS = [
  {
    id: 101,
    tableNumber: 4,
    items: [
      {
        foodId: 'item-6',
        name: 'Paneer Lababdar',
        price: 360,
        quantity: 2,
      },
      {
        foodId: 'item-4',
        name: 'Dal Makhani Royale',
        price: 340,
        quantity: 1,
      },
      {
        foodId: 'item-14',
        name: 'Royal Saffron Pistachio Kulfi',
        price: 210,
        quantity: 2,
      },
    ],
    total: 1480,
    status: 'Pending',
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 mins ago
    specialInstructions: 'Mild spice only, please. No extra chili on Paneer.',
  },
  {
    id: 102,
    tableNumber: 12,
    items: [
      {
        foodId: 'item-8',
        name: 'Margherita Bocconcini Pizza',
        price: 390,
        quantity: 1,
      },
      {
        foodId: 'item-9',
        name: 'Smoked Pepperoni & BBQ Chicken Pizza',
        price: 490,
        quantity: 1,
      },
      {
        foodId: 'item-15',
        name: 'Wild Berry Basil Sparkler',
        price: 180,
        quantity: 2,
      },
    ],
    total: 1240,
    status: 'Pending',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(), // 14 mins ago
    specialInstructions: 'Crispy crust on the Margherita pizza.',
  },
  {
    id: 103,
    tableNumber: 2,
    items: [
      {
        foodId: 'item-11',
        name: 'Gourmet Lamb Smash Burger',
        price: 380,
        quantity: 2,
      },
      {
        foodId: 'item-1',
        name: 'Truffle Mushroom Crostini',
        price: 280,
        quantity: 1,
      },
      {
        foodId: 'item-16',
        name: 'Salted Caramel Cold Brew',
        price: 220,
        quantity: 2,
      },
    ],
    total: 1480,
    status: 'Preparing',
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(), // 22 mins ago
    specialInstructions: 'Medium-well lamb patties. No balsamic glaze on burger #2.',
  },
  {
    id: 104,
    tableNumber: 7,
    items: [
      {
        foodId: 'item-2',
        name: 'Smoky Tandoori Chicken Tikka',
        price: 360,
        quantity: 2,
      },
      {
        foodId: 'item-3',
        name: 'Crispy Peri-Peri Lotus Stem',
        price: 240,
        quantity: 1,
      },
    ],
    total: 960,
    status: 'Preparing',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 mins ago
    specialInstructions: 'Extra mint chutney and lemon wedges on the side.',
  },
  {
    id: 105,
    tableNumber: 9,
    items: [
      {
        foodId: 'item-10',
        name: 'Wild Truffle & Porcini Pizza',
        price: 460,
        quantity: 2,
      },
      {
        foodId: 'item-13',
        name: 'Belgian Dark Chocolate Fondant',
        price: 240,
        quantity: 2,
      },
    ],
    total: 1400,
    status: 'Ready',
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32 mins ago
    specialInstructions: 'Warm dessert with ice cream on the side.',
  },
  {
    id: 106,
    tableNumber: 1,
    items: [
      {
        foodId: 'item-7',
        name: 'Kashmiri Mutton Rogan Josh',
        price: 490,
        quantity: 1,
      },
      {
        foodId: 'item-4',
        name: 'Dal Makhani Royale',
        price: 340,
        quantity: 1,
      },
    ],
    total: 830,
    status: 'Ready',
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(), // 28 mins ago
    specialInstructions: null,
  },
  {
    id: 107,
    tableNumber: 6,
    items: [
      {
        foodId: 'item-12',
        name: 'Crispy Herb Paneer Burger',
        price: 290,
        quantity: 1,
      },
      {
        foodId: 'item-15',
        name: 'Wild Berry Basil Sparkler',
        price: 180,
        quantity: 1,
      },
    ],
    total: 470,
    status: 'Served',
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(), // 48 mins ago
    specialInstructions: null,
  },
  {
    id: 108,
    tableNumber: 15,
    items: [
      {
        foodId: 'item-1',
        name: 'Truffle Mushroom Crostini',
        price: 280,
        quantity: 2,
      },
      {
        foodId: 'item-8',
        name: 'Margherita Bocconcini Pizza',
        price: 390,
        quantity: 1,
      },
      {
        foodId: 'item-13',
        name: 'Belgian Dark Chocolate Fondant',
        price: 240,
        quantity: 1,
      },
    ],
    total: 1190,
    status: 'Served',
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(), // 65 mins ago
    specialInstructions: 'Severe peanut/nut allergy for guest at seat 2.',
  },
];
