# Ecommerce API

A robust and scalable API built with **Node.js**, **Express**, and **MongoDB** to power an eCommerce platform. This API provides essential functionalities for managing products, users, orders, and more.

---

## Features

- **User Authentication**: Secure login and registration using JWT tokens.
- **Product Management**: Create, update, delete, and fetch products.
- **Order Processing**: Create and track customer orders.
- **Shopping Cart**: Add and remove items from the shopping cart.
- **Payment Integration**: Integrates with payment gateways (e.g., Stripe, PayPal).
- **Admin Dashboard**: Manage users, products, and orders from an admin perspective.

---

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Integration**: Stripe/PayPal (optional)

---

## Installation

### Prerequisites

Make sure you have the following installed on your local machine:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/) (or use MongoDB Atlas for cloud hosting)

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/rikeshhh/ecommerce-backend.git
   cd ecommerce-api
   Install dependencies:
   ```

   ```bash
   npm install
   Set up environment variables. Copy the .env.example file to .env and configure the necessary API keys and MongoDB URI.
   ```

Run the server:

```bash
npm start
The API will be live on http://localhost:5000 (or the port you configured).

API Endpoints
User Authentication
POST /api/auth/register: Register a new user
POST /api/auth/login: Login an existing user
GET /api/auth/logout: Logout the current user
Products
GET /api/products: Get all products
GET /api/products/:id: Get product details by ID
POST /api/products: Add a new product (Admin only)
PUT /api/products/:id: Update product details (Admin only)
DELETE /api/products/:id: Delete a product (Admin only)
Orders
POST /api/orders: Create a new order
GET /api/orders/:id: Get order details by ID
GET /api/orders/user/:userId: Get all orders for a user
Cart
POST /api/cart: Add item to cart
GET /api/cart: Get the user's cart items
DELETE /api/cart/:id: Remove an item from the cart

Contact
Author: Your Name
Email: youremail@example.com
Acknowledgements
Express - The framework used for building the API.
MongoDB - The NoSQL database used for storage.
JWT - Authentication using JSON Web Tokens.

### Key Sections:

- **Project Title**: Clear, concise description.
- **Features**: Key functionalities you’ve built into the API.
- **Tech Stack**: The technologies you're using.
- **Installation**: How to get the API up and running.
- **API Endpoints**: Example endpoints for users and developers.
- **Contributing**: Guide for how others can contribute to your project.
- **License**: Open-source license for your project.
- **Contact**: How people can reach you for questions or contributions.
- **Acknowledgements**: Credit to any libraries or tools you used.
```
