# My Book Shop Backend

This is the backend for the My Book Shop application, built with Node.js, Express, and MongoDB. It provides APIs for user authentication, book management, and other functionalities required for the book shop.

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Middleware](#middleware)
- [Database](#database)
- [License](#license)

## Installation

1. Clone the repository:

   ```sh
   https://github.com/Jubayer-Ahmed-Sajid/my-book-shop-server-side.git
   cd my-book-shop-backend
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a file in the root directory and add the following environment variables:
   `env
DB_USER = my-book-shop
DB_PASS = 3frPMmKKF86kGp5U
TOKEN_SECRET=7b0792285121564805008d121fed3e486ff9b34867f67169c8346d2f7cfe1486bdb27cafdc5ee55784e10e67aa4a108b829fbb4905cc0afeb2b7545960831e37
    `

4. Start the server:
   ```sh
   npm start
   ```

## Environment Variables

DB_USER = my-book-shop
DB_PASS = 3frPMmKKF86kGp5U
TOKEN_SECRET=7b0792285121564805008d121fed3e486ff9b34867f67169c8346d2f7cfe1486bdb27cafdc5ee55784e10e67aa4a108b829fbb4905cc0afeb2b7545960831e37

## API Endpoints

### User APIs

- `POST /jwt`: Generate JWT token
- `POST /users`: Insert a new user
- `GET /user/:email`: Get user data by email
- `PATCH /users/add-wishlist`: Add an item to the wishlist
- `PATCH /users/remove-wishlist`: Remove an item from the wishlist
- `PATCH /users/add-cart`: Add an item to the cart
- `PATCH /users/remove-cart`: Remove an item from the cart
- `PATCH /users/buy`: Buy an item
- `GET /all-users`: Get all users (Admin only)
- `PATCH /user/update/:email`: Update user admin status (Admin only)
- `PATCH /seller/approve/:email`: Approve seller status (Admin only)
- `DELETE /user/delete/:email`: Delete a user (Admin only)

### Book APIs

- `POST /books`: Insert a new book (Seller/Admin only)
- `PATCH /book/update/:id`: Update a book (Seller/Admin only)
- `DELETE /book/delete/:id`: Delete a book (Seller/Admin only)
- `GET /all-books`: Get all books with optional filtering and sorting
- `GET /books/:id`: Get a single book by ID
- `GET /admin-books`: Get all books (Admin only)
- `GET /featured-books`: Get books for the featured section
- `GET /added-books/:email`: Get books added by a seller

### Testimonial APIs

- `GET /testimonials`: Get all testimonials

## Middleware

- : Middleware to verify JWT token
- : Middleware to verify seller role
- : Middleware to verify buyer role
- : Middleware to verify admin role

## Database

- MongoDB is used as the database.
- Collections:
  - `Users`: Stores user information
  - : Stores book information
  - `testimonials`: Stores testimonials

## License

This project is licensed under the MIT License.
