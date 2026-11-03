/**
 * ServeSync Mock Data — Customer Menu (Phase 1)
 * Single source of truth for restaurant information and food items.
 */

export const RESTAURANT_INFO = {
  name: 'The Forest Table',
  tagline: 'Artisanal Dining & Modern Gastronomy',
  description:
    'Savor curated culinary creations crafted with organic seasonal produce, heritage spices, and modern presentation.',
  rating: '4.9',
  reviewsCount: '640+',
  prepTime: '20-25 mins',
  address: 'Tabletop QR Ordering System',
  cuisine: 'Modern Indian • Continental • Craft Beverages',
};

export const CATEGORIES = [
  'All',
  'Starters',
  'Main Course',
  'Pizza',
  'Burgers',
  'Desserts',
  'Drinks',
];

export const MENU_ITEMS = [
  {
    id: 'item-1',
    name: 'Truffle Mushroom Crostini',
    description:
      'Crisp sourdough slices topped with sautéed wild mushrooms, garlic herb butter, and white truffle oil drizzle.',
    price: 280,
    category: 'Starters',
    image:
      'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: true,
  },
  {
    id: 'item-2',
    name: 'Smoky Tandoori Chicken Tikka',
    description:
      'Tender chicken morsels marinated in spiced yogurt and mustard oil, chargrilled to perfection with mint dip.',
    price: 360,
    category: 'Starters',
    image:
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isPopular: true,
  },
  {
    id: 'item-3',
    name: 'Crispy Peri-Peri Lotus Stem',
    description:
      'Flash-fried thinly sliced lotus stem tossed in fiery house peri-peri seasoning and toasted sesame seeds.',
    price: 240,
    category: 'Starters',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: false,
  },
  {
    id: 'item-4',
    name: 'Dal Makhani Royale',
    description:
      'Slow-cooked black lentils simmered overnight with churned white butter, rich dairy cream, and roasted fenugreek.',
    price: 340,
    category: 'Main Course',
    image:
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: true,
  },
  {
    id: 'item-5',
    name: 'Murg Makhani Laziz',
    description:
      'Boneless chargrilled chicken steeped in a velvety tomato, cashew nut, and honey reduction garnished with cream.',
    price: 440,
    category: 'Main Course',
    image:
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isPopular: true,
  },
  {
    id: 'item-6',
    name: 'Paneer Lababdar',
    description:
      'Fresh cottage cheese cubes folded into a rich, chunky onion-tomato gravy with grated paneer and whole spices.',
    price: 360,
    category: 'Main Course',
    image:
      'https://images.unsplash.com/photo-1567184109411-b28f2bafb977?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: false,
  },
  {
    id: 'item-7',
    name: 'Kashmiri Mutton Rogan Josh',
    description:
      'Prime cuts of lamb braised with aromatic Kashmiri red chillies, crushed green cardamom, and mountain saffron.',
    price: 490,
    category: 'Main Course',
    image:
      'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isPopular: true,
  },
  {
    id: 'item-8',
    name: 'Margherita Bocconcini Pizza',
    description:
      'Artisanal hand-stretched sourdough crust with San Marzano tomato sauce, fresh bocconcini mozzarella, and basil.',
    price: 390,
    category: 'Pizza',
    image:
      'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: false,
  },
  {
    id: 'item-9',
    name: 'Smoked Pepperoni & BBQ Chicken Pizza',
    description:
      'Loaded with smoky roasted chicken, spiced pepperoni slices, aged mozzarella, and house smoky barbecue sauce.',
    price: 490,
    category: 'Pizza',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isPopular: true,
  },
  {
    id: 'item-10',
    name: 'Wild Truffle & Porcini Pizza',
    description:
      'White garlic cream base with fontina cheese, sautéed porcini and shiitake mushrooms, finished with aromatic truffle glaze.',
    price: 460,
    category: 'Pizza',
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: true,
  },
  {
    id: 'item-11',
    name: 'Gourmet Lamb Smash Burger',
    description:
      'Juicy double lamb patty smashed with caramelized balsamic onions, sharp cheddar, and garlic aioli in toasted brioche.',
    price: 380,
    category: 'Burgers',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isPopular: true,
  },
  {
    id: 'item-12',
    name: 'Crispy Herb Paneer Burger',
    description:
      'Spiced panko-crusted cottage cheese steak, crunchy iceberg lettuce, pickled gherkins, and smoked sriracha mayo.',
    price: 290,
    category: 'Burgers',
    image:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: false,
  },
  {
    id: 'item-13',
    name: 'Belgian Dark Chocolate Fondant',
    description:
      'Warm 70% Belgian chocolate cake with a molten oozing center, dusted with Dutch cocoa and served with vanilla bean ice cream.',
    price: 240,
    category: 'Desserts',
    image:
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: true,
  },
  {
    id: 'item-14',
    name: 'Royal Saffron Pistachio Kulfi',
    description:
      'Traditional slow-reduced milk kulfi infused with Kashmiri saffron threads, fragrant green cardamom, and toasted pistachios.',
    price: 210,
    category: 'Desserts',
    image:
      'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: false,
  },
  {
    id: 'item-15',
    name: 'Wild Berry Basil Sparkler',
    description:
      'Muddled fresh blackberries and strawberries with Thai sweet basil leaves, fresh lime juice, and effervescent soda.',
    price: 180,
    category: 'Drinks',
    image:
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: true,
  },
  {
    id: 'item-16',
    name: 'Salted Caramel Cold Brew',
    description:
      '18-hour steeped single-origin Arabica cold brew layered with artisanal salted caramel and sweet vanilla cold foam.',
    price: 220,
    category: 'Drinks',
    image:
      'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isPopular: false,
  },
];
