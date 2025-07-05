# Tradesman Order & Management System

A comprehensive platform connecting local businesses with customers through a digital ordering system. This project includes an admin panel for business owners and an API for mobile applications.

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?&style=for-the-badge&logo=Socket.io&logoColor=white)

## Features

### User Management
- Multiple user roles: Admin, Tradesman (Business Owner), Customer
- JWT-based authentication system
- Secure password handling

### Store Management
- Create, edit, and delete stores
- Assign tradesmen to stores
- Manage store open/closed status

### Product Management
- Full CRUD operations for products (name, description, price, stock, image)
- Product categorization
- Image upload functionality

### Order System
- Customers can create orders via API
- Tradesmen receive and process orders
- Order status tracking:
  - Pending
  - Preparing
  - On the way
  - Delivered
  - Cancelled

### Real-time Notifications
- Socket.io integration for real-time updates
- Notifications for new orders and status changes

### Reporting
- Daily order count and revenue
- Weekly/monthly order statistics
- Most sold products analysis

### Admin Features
- View all stores and users
- Ban problematic users
- System-wide management capabilities

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **API Documentation**: Swagger / OpenAPI
- **File Upload**: Multer

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/tradesman-order-management.git
   cd tradesman-order-management
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables (create a .env file):
   ```
   PORT=3000
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   DB_FORCE=false
   ```

4. Seed the database:
   ```
   npm run seed
   ```

5. Start the server:
   ```
   npm start
   ```

6. For development with auto-restart:
   ```
   npm run dev
   ```

## API Documentation

Once the server is running, you can access the API documentation at:
```
http://localhost:3000/api-docs
```

## Default Login Credentials

### Admin User
- Email: admin@tradesman.com
- Password: admin123

### Tradesman User
- Email: esnaf@tradesman.com
- Password: esnaf123

### Customer User
- Email: musteri@tradesman.com
- Password: musteri123

## Project Structure

```
.
├── public/            # Static files (HTML, CSS, JS)
├── src/
│   ├── config/        # Database and app configuration
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Custom middleware
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── utils/         # Utility functions
│   │   └── seeders/   # Database seeders
│   └── index.js       # Application entry point
├── uploads/           # Uploaded files
└── package.json       # Project dependencies
```

## License

Apache 2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
