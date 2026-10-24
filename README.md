# ServeSync

ServeSync is a full-stack restaurant ordering system that enables customers to scan a QR code at their table, browse a digital menu, add items to a cart, place orders, and track order status. Restaurant staff can manage menu items and monitor incoming orders through dedicated admin and kitchen dashboards.

---

## Project Overview

Traditional restaurant ordering often relies on waiters manually taking orders and communicating them to the kitchen.

ServeSync digitizes this workflow by providing:

* QR-based menu access
* Digital food ordering
* Centralized menu administration
* Kitchen order tracking
* Seamless order management

---

## Version 1 Features

### Admin Module

* Admin Login
* Add Food Items
* View Food Items
* Delete Food Items
* Manage Restaurant Menu

### Customer Module

* Scan QR Code
* View Digital Menu
* Browse Food Categories
* Add Items to Cart
* Update Cart Quantity
* Place Orders

### Kitchen Module

* View Incoming Orders
* View Table Number
* Update Order Status

### Database Integration

* Store Menu Items
* Store Orders
* Store Admin Information
* Persistent Data Storage Using MongoDB

---

## User Flow

```text
Admin Adds Menu Item
        ↓
Menu Stored in MongoDB
        ↓
Customer Scans QR Code
        ↓
Customer Views Menu
        ↓
Customer Adds Items to Cart
        ↓
Customer Places Order
        ↓
Order Stored in MongoDB
        ↓
Kitchen Dashboard Receives Order
        ↓
Kitchen Updates Order Status
```

---

## Tech Stack

### Frontend

* React
* React Router DOM
* Axios
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JWT (JSON Web Tokens)

---

## Project Structure

```text
servesync/
├── README.md
├── .gitignore
│
├── client/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── .env
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── routes/
│       │   ├── AppRoutes.jsx
│       │   └── ProtectedRoute.jsx
│       ├── pages/
│       │   ├── customer/
│       │   │   ├── MenuPage.jsx
│       │   │   ├── CartPage.jsx
│       │   │   ├── CheckoutPage.jsx
│       │   │   └── OrderStatusPage.jsx
│       │   └── admin/
│       │       ├── AdminLoginPage.jsx
│       │       ├── AdminDashboardPage.jsx
│       │       ├── AddFoodPage.jsx
│       │       └── KitchenDashboardPage.jsx
│       ├── components/
│       │   ├── common/
│       │   ├── customer/
│       │   └── admin/
│       ├── context/
│       │   ├── CartContext.jsx
│       │   └── AuthContext.jsx
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── menuService.js
│       │   └── orderService.js
│       └── mocks/
│           └── mockData.js
│
└── server/
    ├── package.json
    ├── .env
    ├── server.js
    ├── app.js
    ├── config/
    │   └── db.js
    ├── models/
    │   ├── Admin.js
    │   ├── MenuItem.js
    │   └── Order.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── menuRoutes.js
    │   └── orderRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── menuController.js
    │   └── orderController.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   └── errorMiddleware.js
    └── seed/
        └── seedAdmin.js
```

---

## Database Collections

### Admin

```json
{
  "email": "admin@example.com",
  "password": "hashed_password"
}
```

### MenuItem

```json
{
  "name": "Pizza",
  "price": 299,
  "category": "Main Course",
  "description": "Cheese Burst Pizza"
}
```

### Order

```json
{
  "table": 3,
  "items": [
    {
      "name": "Pizza",
      "quantity": 2
    }
  ],
  "total": 598,
  "status": "Pending"
}
```

---

## API Endpoints

### Authentication

```http
POST /api/auth/login
```

### Menu Management

```http
GET    /api/menu
POST   /api/menu
DELETE /api/menu/:id
```

### Order Management

```http
POST  /api/orders
GET   /api/orders
PATCH /api/orders/:id/status
```

---

## Frontend Pages

### Customer Pages

```text
/menu
/cart
/checkout
/order-status
```

### Admin Pages

```text
/admin/login
/admin/dashboard
/admin/add-food
```

### Kitchen Pages

```text
/kitchen
```

---

## Future Enhancements

Version 2 may include:

* QR Code Generation & Management
* Real-Time Order Updates using Socket.IO
* Online Payments
* Analytics Dashboard
* Multi-Restaurant Support

---

## Learning Goals

This project is being developed to gain hands-on experience with:

* React
* Express.js
* MongoDB
* Mongoose
* REST APIs
* Authentication
* State Management
* Git & GitHub Collaboration
* Full-Stack Application Development
