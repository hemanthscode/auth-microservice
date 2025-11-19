# **Enterprise Authentication Microservice**
## **Complete User Guide & Documentation**

**Version:** 1.0.0  
**Last Updated:** November 19, 2025  
**Author:** Enterprise Development Team  
**License:** MIT

***

## **Table of Contents**

1. [Introduction](#1-introduction)
2. [Architecture Overview](#2-architecture-overview)
3. [Installation & Setup](#3-installation--setup)
4. [Integration Guide](#4-integration-guide)
5. [Configuration & Customization](#5-configuration--customization)
6. [Usage Examples](#6-usage-examples)
7. [Deployment Guide](#7-deployment-guide)
8. [Troubleshooting Guide](#8-troubleshooting-guide)
9. [Security Best Practices](#9-security-best-practices)
10. [Versioning & Maintenance](#10-versioning--maintenance)
11. [FAQ](#11-faq)

***

## **1. Introduction**

### **1.1 What is This Service?**

The **Enterprise Authentication Microservice** is a production-ready, reusable authentication and authorization solution built with the MERN stack (MongoDB, Express.js, React-ready, Node.js). It provides comprehensive user management, role-based access control (RBAC), OAuth integration, and security features that can be seamlessly integrated into any application.[1][2]

### **1.2 Purpose**

This microservice eliminates the need to build authentication from scratch for every project. It provides a secure, scalable, and maintainable authentication layer that follows industry best practices and enterprise-grade security standards.[3][4]

### **1.3 Key Features**

- **JWT-based Authentication** - Secure access and refresh token management
- **OAuth 2.0 Integration** - Google, Facebook, and GitHub social login
- **Role-Based Access Control (RBAC)** - Granular permission management
- **Email Verification** - Automated email verification workflow
- **Password Management** - Secure password reset and change functionality
- **Session Management** - Multi-device session tracking and revocation
- **Rate Limiting** - DDoS protection and abuse prevention
- **Comprehensive Logging** - Winston-based logging with multiple transports
- **Input Validation** - Express-validator for request sanitization
- **Audit Trail** - Track user activities and security events

### **1.4 Typical Use-Cases**

- **SaaS Applications** - Multi-tenant applications requiring user authentication
- **E-commerce Platforms** - Customer account management and order tracking
- **Content Management Systems** - Editor and admin access control
- **Internal Tools** - Employee portals with role-based permissions
- **Mobile Apps** - Backend authentication for iOS/Android applications
- **API Services** - Secure API access for third-party integrations

## **2. Architecture Overview**

### **2.1 Technology Stack**

**Backend Framework:**
- Node.js v18+ (Runtime)
- Express.js v4.18+ (Web framework)

**Database:**
- MongoDB v6.0+ (NoSQL database)
- Mongoose v8.0+ (ODM)

**Authentication:**
- JWT (jsonwebtoken v9.0+)
- Passport.js (OAuth strategies)
- bcrypt.js (Password hashing)

**Email Service:**
- Nodemailer v6.9+ (Email delivery)

**Security:**
- Helmet.js (HTTP security headers)
- express-rate-limit (Rate limiting)
- express-validator (Input validation)

**Logging:**
- Winston v3.11+ (Application logging)
- Morgan (HTTP request logging)

### **2.2 Folder Structure**

```
auth-microservice/
└── server/
    ├── config/                     # Configuration modules
    │   ├── db.js                   # MongoDB connection
    │   ├── jwt.js                  # JWT token management
    │   ├── oauth.js                # OAuth provider setup
    │   └── index.js                # Config aggregator
    ├── controllers/                # Request handlers
    │   ├── authController.js
    │   ├── userController.js
    │   ├── oauthController.js
    │   ├── roleController.js
    │   └── passwordController.js
    ├── middleware/                 # Custom middleware
    │   ├── authMiddleware.js       # JWT authentication
    │   ├── rbacMiddleware.js       # Role-based access control
    │   ├── validationMiddleware.js # Request validation
    │   ├── errorHandler.js         # Error handling
    │   └── rateLimiter.js          # Rate limiting
    ├── models/                     # Database models
    │   ├── User.js
    │   ├── Role.js
    │   ├── Token.js
    │   └── OAuthProvider.js
    ├── routes/                     # API routes
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── oauthRoutes.js
    │   ├── roleRoutes.js
    │   └── passwordRoutes.js
    ├── services/                   # Business logic
    │   ├── authService.js
    │   ├── userService.js
    │   ├── oauthService.js
    │   ├── roleService.js
    │   ├── emailService.js
    │   ├── tokenService.js
    │   └── loggerService.js
    ├── utils/                      # Utility functions
    │   ├── helpers.js
    │   ├── constants.js
    │   └── errors.js
    ├── validators/                 # Request validators
    │   ├── authValidator.js
    │   ├── userValidator.js
    │   ├── oauthValidator.js
    │   ├── roleValidator.js
    │   └── passwordValidator.js
    ├── logs/                       # Application logs (generated)
    ├── scripts/                    # Added new scripts folder
    │   ├── cleanDatabase.js        # Clean/reset DB
    │   ├── initRoles.js            # Initialize default roles
    │   └── seedData.js             # (Moved from root)
    ├── .env                        # Environment variables
    ├── .gitignore                  # Git ignore rules
    ├── app.js                      # Express app setup
    ├── server.js                   # Server entry point
    ├── package.json                # Dependencies
    └── README.md                   # Project documentation

```

### **2.3 Core Modules**

**Authentication Flow:**
```
User Request → Routes → Middleware (Validation) → Controllers → Services → Models → Database
                  ↓
              Middleware (Auth/RBAC) → JWT Verification → Role Check
                  ↓
              Response ← Controllers ← Services ← Database Query Result
```

**Data Flow Diagram (Text-based):**
```
┌─────────────┐
│   Client    │
│ (Frontend/  │
│  Postman)   │
└──────┬──────┘
       │ HTTP Request
       ↓
┌────────────────────────────────────┐
│         Express Server             │
│  ┌─────────────────────────────┐   │
│  │   Routes & Middleware       │   │
│  │ • Rate Limiter              │   │
│  │ • Input Validation          │   │
│  │ • Authentication Check      │   │
│  │ • RBAC Permission Check     │   │
│  └────────────┬────────────────┘   │
│               ↓                    │
│  ┌─────────────────────────────┐   │
│  │      Controllers            │   │
│  │ • Parse request             │   │
│  │ • Call services             │   │
│  │ • Format response           │   │
│  └────────────┬────────────────┘   │
│               ↓                    │
│  ┌─────────────────────────────┐   │
│  │       Services              │   │
│  │ • Business logic            │   │
│  │ • Token generation          │   │
│  │ • Email sending             │   │
│  │ • Data processing           │   │
│  └────────────┬────────────────┘   │
│               ↓                    │
│  ┌─────────────────────────────┐   │
│  │        Models               │   │
│  │ • Data validation           │   │
│  │ • Schema enforcement        │   │
│  │ • Database operations       │   │
│  └────────────┬────────────────┘   │
└───────────────┼────────────────────┘
                ↓
        ┌───────────────┐
        │   MongoDB     │
        │   Database    │
        └───────────────┘
```

### **2.4 Security Architecture**

- **Password Storage:** bcrypt hashing with 12 salt rounds
- **Token Security:** JWT with RS256 or HS256 signing
- **Session Management:** Refresh token rotation with database persistence
- **Rate Limiting:** IP-based throttling with configurable limits
- **Input Sanitization:** Express-validator for SQL/NoSQL injection prevention
- **CORS Protection:** Configurable origin whitelisting
- **HTTP Security:** Helmet.js for security headers

***

## **3. Installation & Setup**

### **3.1 Prerequisites**

**Required:**
- Node.js v18.0.0 or higher
- MongoDB v6.0 or higher
- npm v9.0.0 or higher
- Git (for version control)

**Optional:**
- Docker & Docker Compose (for containerized deployment)
- Postman (for API testing)
- MongoDB Compass (for database visualization)

### **3.2 Environment Variables**

Create a `.env` file in the project root with the following configuration:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=5000
API_VERSION=v1

# ============================================
# DATABASE CONFIGURATION
# ============================================
MONGODB_URI=mongodb://localhost:27017/auth-microservice
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auth-microservice

# ============================================
# JWT CONFIGURATION
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
JWT_REFRESH_EXPIRE=7d

# ============================================
# COOKIE CONFIGURATION
# ============================================
COOKIE_EXPIRE=7

# ============================================
# EMAIL CONFIGURATION
# ============================================
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@yourapp.com

# ============================================
# OAUTH - GOOGLE
# ============================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/oauth/google/callback

# ============================================
# OAUTH - FACEBOOK
# ============================================
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/v1/oauth/facebook/callback

# ============================================
# OAUTH - GITHUB
# ============================================
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/v1/oauth/github/callback

# ============================================
# FRONTEND URLS
# ============================================
CLIENT_URL=http://localhost:3000
CLIENT_SUCCESS_REDIRECT=/dashboard
CLIENT_FAILURE_REDIRECT=/login

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# SECURITY
# ============================================
BCRYPT_SALT_ROUNDS=12
PASSWORD_RESET_EXPIRE=3600000
EMAIL_VERIFICATION_EXPIRE=86400000

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
```

### **3.3 Installation Steps**

**Step 1: Clone the Repository**
```bash
git clone https://github.com/your-org/auth-microservice.git
cd auth-microservice
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Configure Environment**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

**Step 4: Generate JWT Secrets**
```bash
# Generate secure random secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output to JWT_SECRET in .env

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output to JWT_REFRESH_SECRET in .env
```

**Step 5: Initialize Database**
```bash
# Seed default roles and sample users
node seedData.js
```

**Step 6: Start Development Server**
```bash
npm run dev
```

**Step 7: Verify Installation**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-11-19T05:00:00.000Z"
}
```

### **3.4 Running in Production**

**Step 1: Set Production Environment**
```bash
export NODE_ENV=production
```

**Step 2: Use Production Database**
Update `.env`:
```env
MONGODB_URI=mongodb+srv://prod-user:password@prod-cluster.mongodb.net/auth-prod
```

**Step 3: Start Production Server**
```bash
npm start
```

**Recommended: Use PM2 for Process Management**
```bash
npm install -g pm2
pm2 start server.js --name auth-service
pm2 save
pm2 startup
```

### **3.5 Seeding Test Data**

The `seedData.js` script creates:
- 5 default roles (superadmin, admin, moderator, user, guest)
- 4 sample users with different roles

```bash
node seedData.js
```

Sample credentials after seeding:
```
Superadmin:
Email: superadmin@example.com
Password: SuperAdmin123!

Admin:
Email: alice.admin@example.com
Password: AdminPass123!

Moderator:
Email: mark.moderator@example.com
Password: Moderator123!

User:
Email: user.one@example.com
Password: UserPass123!
```

***

## **4. Integration Guide**

### **4.1 Integrating as a Standalone Microservice**

**Option A: Separate Service with API Gateway**

```
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│ API Gateway  │────▶│ Auth Service │
│              │      │  (Port 8000) │     │ (Port 5000)  │
└──────────────┘      └──────┬───────┘     └──────────────┘
                            │
                            ▼
                     ┌───────────────┐
                     │ Other Services│
                     │  (Port 6000+) │
                     └───────────────┘
```

**Configure Nginx as API Gateway:**
```nginx
server {
    listen 8000;
    
    location /api/v1/auth {
        proxy_pass http://localhost:5000/api/v1/auth;
    }
    
    location /api/v1/users {
        proxy_pass http://localhost:5000/api/v1/users;
    }
    
    location /api/v1/other {
        proxy_pass http://localhost:6000/api/v1;
    }
}
```

**Option B: Direct Integration into Existing Project**

Copy the microservice into your project:
```bash
mkdir services
cp -r auth-microservice services/auth
```

Import in your main app:
```javascript
// app.js
const express = require('express');
const authRoutes = require('./services/auth/routes/authRoutes');
const userRoutes = require('./services/auth/routes/userRoutes');

const app = express();

// Mount auth routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
```

### **4.2 API Endpoints**

**Base URL:** `http://localhost:5000/api/v1`

#### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/logout` | Logout user | Yes |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/verify-email/:token` | Verify email address | No |
| POST | `/auth/resend-verification` | Resend verification email | No |
| PUT | `/auth/change-password` | Change password | Yes |
| GET | `/auth/me` | Get current user | Yes |
| GET | `/auth/sessions` | Get active sessions | Yes |
| DELETE | `/auth/sessions/:sessionId` | Revoke session | Yes |

#### **User Management Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update profile | Yes |
| PUT | `/users/preferences` | Update preferences | Yes |
| DELETE | `/users/profile` | Delete account | Yes |
| GET | `/users` | List users (admin) | Yes (Admin) |
| GET | `/users/search` | Search users | Yes |
| GET | `/users/:userId` | Get user by ID (admin) | Yes (Admin) |
| PUT | `/users/:userId/role` | Update user role (admin) | Yes (Admin) |
| PUT | `/users/:userId/activate` | Activate user (admin) | Yes (Admin) |
| PUT | `/users/:userId/deactivate` | Deactivate user (admin) | Yes (Admin) |

#### **OAuth Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/oauth/google` | Initiate Google OAuth | No |
| GET | `/oauth/google/callback` | Google callback | No |
| GET | `/oauth/facebook` | Initiate Facebook OAuth | No |
| GET | `/oauth/facebook/callback` | Facebook callback | No |
| GET | `/oauth/github` | Initiate GitHub OAuth | No |
| GET | `/oauth/github/callback` | GitHub callback | No |
| GET | `/oauth/providers` | Get linked providers | Yes |
| DELETE | `/oauth/:provider` | Unlink provider | Yes |

#### **Role Management Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/roles/initialize` | Initialize default roles | Yes (Superadmin) |
| POST | `/roles` | Create role | Yes (Superadmin) |
| GET | `/roles` | List roles | Yes (Admin) |
| GET | `/roles/:roleId` | Get role by ID | Yes (Admin) |
| PUT | `/roles/:roleId` | Update role | Yes (Superadmin) |
| DELETE | `/roles/:roleId` | Delete role | Yes (Superadmin) |
| GET | `/roles/:roleId/permissions` | Get role permissions | Yes (Admin) |
| POST | `/roles/:roleId/permissions` | Add permission | Yes (Superadmin) |
| DELETE | `/roles/:roleId/permissions` | Remove permission | Yes (Superadmin) |

#### **Password Management Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/password/forgot` | Request password reset | No |
| POST | `/password/reset/:token` | Reset password | No |
| GET | `/password/verify/:token` | Verify reset token | No |

### **4.3 Request/Response Examples**

**Register User:**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

Response (201 Created):
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "id": "6478abc123def456789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": {
        "name": "user",
        "displayName": "User"
      },
      "isEmailVerified": false,
      "createdAt": "2025-11-19T05:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Login User:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

Response (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "6478abc123def456789",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Protected Route (with Bearer Token):**
```bash
GET /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6478abc123def456789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": {
        "name": "user",
        "level": 3
      },
      "isEmailVerified": true,
      "createdAt": "2025-11-19T05:00:00.000Z"
    }
  }
}
```

### **4.4 Frontend Integration Example**

**React/Next.js Integration:**

```javascript
// services/authService.js
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const authService = {
  register: async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    if (response.data.success) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    if (response.data.success) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    return response.data;
  },

  logout: async () => {
    const token = localStorage.getItem('accessToken');
    await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    localStorage.removeItem('accessToken');
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data.user;
  }
};

export default authService;
```

**Usage in Components:**
```javascript
// pages/login.js
import { useState } from 'react';
import authService from '../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await authService.login({ email, password });
      if (result.success) {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### **4.5 Mobile App Integration (React Native)**

```javascript
// services/authService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProfile = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  const response = await axios.get(`${API_BASE_URL}/users/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data.user;
};
```

***

## **5. Configuration & Customization**

### **5.1 Modifying Environment Configuration**

**JWT Token Expiry:**
```env
# Short-lived access token (default: 15 minutes)
JWT_EXPIRE=15m

# Long-lived refresh token (default: 7 days)
JWT_REFRESH_EXPIRE=7d
```

**Rate Limiting:**
```env
# Time window in milliseconds (default: 15 minutes)
RATE_LIMIT_WINDOW_MS=900000

# Max requests per window (default: 100)
RATE_LIMIT_MAX_REQUESTS=100
```

**Password Security:**
```env
# bcrypt salt rounds (higher = more secure but slower)
BCRYPT_SALT_ROUNDS=12

# Password reset token expiry (1 hour)
PASSWORD_RESET_EXPIRE=3600000

# Email verification token expiry (24 hours)
EMAIL_VERIFICATION_EXPIRE=86400000
```

### **5.2 Customizing User Roles**

**Edit `models/Role.js` to add custom resources:**

```javascript
// Add new resource to permissions enum
const roleSchema = new mongoose.Schema({
  permissions: [{
    resource: {
      type: String,
      enum: [
        'users', 'roles', 'posts', 'comments',
        'products',  // NEW: Add custom resource
        'orders',    // NEW: Add custom resource
        // ... existing resources
      ],
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage'],
    }],
  }],
});
```

**Update `utils/constants.js`:**
```javascript
const RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  PRODUCTS: 'products',  // NEW
  ORDERS: 'orders',      // NEW
};
```

### **5.3 Adding Custom Middleware**

**Create custom authorization middleware:**

```javascript
// middleware/customAuth.js
const { AppError } = require('../utils/errors');

/**
 * Check if user owns the resource
 */
const requireOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceOwnerId = req.params[resourceField] || req.body[resourceField];
    
    if (req.user._id.toString() !== resourceOwnerId.toString()) {
      const isAdmin = ['admin', 'superadmin'].includes(req.user.role.name);
      
      if (!isAdmin) {
        return next(new AppError('You can only access your own resources', 403));
      }
    }
    
    next();
  };
};

module.exports = { requireOwnership };
```

**Use in routes:**
```javascript
// routes/orderRoutes.js
const { requireOwnership } = require('../middleware/customAuth');

router.get('/orders/:orderId', 
  authenticate, 
  requireOwnership('orderId'),
  orderController.getOrder
);
```

### **5.4 Extending Controllers**

**Add custom controller methods:**

```javascript
// controllers/userController.js

/**
 * Custom: Get user statistics
 */
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  // Add your custom logic
  const stats = {
    totalPosts: await Post.countDocuments({ author: userId }),
    totalComments: await Comment.countDocuments({ author: userId }),
    joinedDate: req.user.createdAt,
  };
  
  res.status(200).json({
    success: true,
    data: { stats },
  });
});

module.exports = {
  // ... existing exports
  getUserStats,  // NEW
};
```

**Add route:**
```javascript
// routes/userRoutes.js
router.get('/stats', authenticate, userController.getUserStats);
```

### **5.5 Customizing Email Templates**

**Edit `services/emailService.js`:**

```javascript
const sendWelcomeEmail = async (email, firstName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* Your custom CSS styles */
        body { font-family: 'Your Custom Font', Arial, sans-serif; }
        .header { background: #your-brand-color; }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="https://yourapp.com/logo.png" alt="Logo">
        <h1>Welcome ${firstName}!</h1>
      </div>
      <!-- Your custom email content -->
    </body>
    </html>
  `;
  
  return await sendEmail({ to: email, subject: 'Welcome!', html });
};
```

### **5.6 Disabling Features**

**Disable OAuth providers:**

Comment out in `config/oauth.js`:
```javascript
// Disable Google OAuth
// if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
//   passport.use(new GoogleStrategy(...));
// }
```

**Disable email verification requirement:**

In `middleware/authMiddleware.js`, comment out:
```javascript
// const requireEmailVerification = (req, res, next) => {
//   if (!req.user.isEmailVerified) {
//     return next(new AppError('Email verification required', 403));
//   }
//   next();
// };
```

***

## **6. Usage Examples**

### **6.1 Use Case: E-commerce Platform**

**Scenario:** Build an e-commerce platform with customer accounts and admin panel.

**Implementation:**

1. **User Registration Flow:**
```javascript
// Frontend: Register customer
const registerCustomer = async (userData) => {
  const response = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  return data;
};
```

2. **Admin Dashboard Access:**
```javascript
// Protect admin routes
router.get('/admin/dashboard', 
  authenticate, 
  requireRole('admin', 'superadmin'),
  adminController.getDashboard
);
```

3. **Customer Order Management:**
```javascript
// Allow customers to view only their orders
router.get('/orders', 
  authenticate,
  async (req, res) => {
    const orders = await Order.find({ userId: req.userId });
    res.json({ success: true, data: { orders } });
  }
);
```

### **6.2 Use Case: SaaS Application**

**Scenario:** Multi-tenant SaaS with different subscription tiers.

**Custom Role Implementation:**

```javascript
// Add subscription-based permissions
const SUBSCRIPTION_ROLES = {
  FREE: {
    name: 'free',
    permissions: [
      { resource: 'projects', actions: ['create', 'read'] }, // Max 3 projects
      { resource: 'reports', actions: ['read'] },
    ],
    limits: { maxProjects: 3, maxTeamMembers: 1 }
  },
  PRO: {
    name: 'pro',
    permissions: [
      { resource: 'projects', actions: ['manage'] },
      { resource: 'reports', actions: ['create', 'read', 'update'] },
      { resource: 'integrations', actions: ['manage'] },
    ],
    limits: { maxProjects: 50, maxTeamMembers: 10 }
  },
  ENTERPRISE: {
    name: 'enterprise',
    permissions: [
      { resource: 'projects', actions: ['manage'] },
      { resource: 'reports', actions: ['manage'] },
      { resource: 'integrations', actions: ['manage'] },
      { resource: 'analytics', actions: ['manage'] },
    ],
    limits: { maxProjects: -1, maxTeamMembers: -1 } // Unlimited
  }
};
```

### **6.3 Use Case: Content Management System**

**Scenario:** Blog platform with editors, contributors, and readers.

**Custom Workflow:**

```javascript
// Custom permission check for content
const canEditPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  
  if (!post) {
    return next(new AppError('Post not found', 404));
  }
  
  // Post author or editor/admin can edit
  const isAuthor = post.author.toString() === req.userId.toString();
  const isEditor = ['editor', 'admin', 'superadmin'].includes(req.user.role.name);
  
  if (!isAuthor && !isEditor) {
    return next(new AppError('You cannot edit this post', 403));
  }
  
  next();
});

router.put('/posts/:postId', authenticate, canEditPost, postController.updatePost);
```

### **6.4 Best Practices**

1. **Always use HTTPS in production**
2. **Implement token refresh before expiry**
3. **Store tokens securely (httpOnly cookies preferred over localStorage)**
4. **Implement logout on all devices functionality**
5. **Log security events (failed logins, role changes)**
6. **Regularly rotate JWT secrets**
7. **Implement account lockout after failed attempts**
8. **Use strong password policies**
9. **Enable two-factor authentication (custom implementation)**
10. **Monitor and audit user activities**

***

## **7. Deployment Guide**

### **7.1 Docker Deployment**

**Create `Dockerfile`:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["node", "server.js"]
```

**Create `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  auth-service:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/auth-microservice
    env_file:
      - .env.production
    depends_on:
      - mongo
    restart: unless-stopped
    networks:
      - app-network

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped
    networks:
      - app-network

volumes:
  mongo-data:

networks:
  app-network:
    driver: bridge
```

**Build and Run:**
```bash
docker-compose up -d
```

### **7.2 CI/CD with GitHub Actions**

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy Auth Microservice

on:
  push:
    branches: [main, production]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/production'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Production
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
        run: |
          echo "$SSH_PRIVATE_KEY" > key.pem
          chmod 600 key.pem
          ssh -i key.pem user@$SERVER_HOST "cd /app/auth-service && git pull && npm install && pm2 restart auth-service"
```

### **7.3 Production Environment Setup**

**Recommended Server Specifications:**
- **CPU:** 2+ cores
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 20GB SSD
- **OS:** Ubuntu 22.04 LTS or similar

**Install Required Software:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

**Configure Nginx Reverse Proxy:**

```nginx
# /etc/nginx/sites-available/auth-service
server {
    listen 80;
    server_name api.yourapp.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/auth-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourapp.com
```

### **7.4 Scaling Strategies**

**Horizontal Scaling with Load Balancer:**

```nginx
# Nginx load balancer config
upstream auth_backend {
    least_conn;
    server 10.0.1.10:5000;
    server 10.0.1.11:5000;
    server 10.0.1.12:5000;
}

server {
    listen 80;
    location / {
        proxy_pass http://auth_backend;
    }
}
```

**Database Scaling:**
- Use MongoDB Atlas with automatic sharding
- Implement read replicas for heavy read operations
- Use connection pooling (configured in `config/db.js`)

**Caching Strategy:**
```javascript
// Add Redis for token blacklist and session caching
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: 6379
});

// Cache user data
const getCachedUser = async (userId) => {
  const cached = await client.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const user = await User.findById(userId);
  await client.setex(`user:${userId}`, 300, JSON.stringify(user)); // 5 min TTL
  return user;
};
```

***

## **8. Troubleshooting Guide**

### **8.1 Common Errors and Solutions**

**Error: "MongoDB connection failed"**

*Cause:* Database not running or incorrect connection string

*Solution:*
```bash
# Check MongoDB status
sudo systemctl status mongod

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/auth-microservice

# Test connection
mongosh "mongodb://localhost:27017/auth-microservice"
```

**Error: "JWT secret not defined"**

*Cause:* Missing or invalid JWT secrets in environment variables

*Solution:*
```bash
# Generate new secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<different-generated-secret>

# Restart server
npm run dev
```

**Error: "Default role not found"**

*Cause:* Roles not initialized in database

*Solution:*
```bash
# Run seed script
node seedData.js

# Or initialize via API (requires superadmin token)
curl -X POST http://localhost:5000/api/v1/roles/initialize \
  -H "Authorization: Bearer <superadmin-token>"
```

**Error: "Email verification failed"**

*Cause:* Invalid email configuration or expired token

*Solution:*
```bash
# Check email settings in .env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Not regular password!

# Generate Gmail app password:
# 1. Enable 2FA on Gmail
# 2. Go to Security → App passwords
# 3. Generate new password
# 4. Use that in .env
```

**Error: "Rate limit exceeded"**

*Cause:* Too many requests from same IP

*Solution:*
```javascript
// Increase rate limits in .env
RATE_LIMIT_MAX_REQUESTS=200  // Increase from 100

// Or whitelist IPs in middleware/rateLimiter.js
const apiLimiter = rateLimit({
  skip: (req) => {
    const whitelistedIPs = ['127.0.0.1', '10.0.0.1'];
    return whitelistedIPs.includes(req.ip);
  }
});
```

**Error: "OAuth callback failed"**

*Cause:* Incorrect callback URL or missing credentials

*Solution:*
1. Verify callback URL matches exactly in OAuth provider settings
2. Check credentials in .env
3. Ensure provider is enabled in `config/oauth.js`
4. Test with browser, not Postman (OAuth requires redirects)

### **8.2 Debugging Tips**

**Enable Debug Logging:**
```env
LOG_LEVEL=debug
NODE_ENV=development
```

**Test Database Connection:**
```javascript
// Create test.js
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
```

**Monitor Logs:**
```bash
# Watch logs in real-time
tail -f logs/combined.log

# Filter errors only
tail -f logs/error.log
```

***

## **9. Security Best Practices**

### **9.1 Secret Management**

**Never commit secrets to Git:**
```bash
# Verify .gitignore includes
cat .gitignore | grep .env
# Should output: .env
```

**Use environment-specific configs:**
```
.env.development
.env.staging
.env.production
```

**Production secret rotation:**
```bash
# Generate new secrets quarterly
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update in production
# Gradual rollout: Support both old and new secrets for 24h
# Then remove old secret
```

### **9.2 Token Security**

**Best practices:**
- Store refresh tokens in httpOnly cookies
- Use short-lived access tokens (15 minutes)
- Implement token rotation on refresh
- Blacklist tokens on logout
- Revoke all tokens on password change

**Implementation:**
```javascript
// Set secure cookie options in production
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

res.cookie('refreshToken', refreshToken, cookieOptions);
```

### **9.3 Input Validation**

**Always validate and sanitize:**
- All request parameters
- Request body data
- Query strings
- File uploads

**Example validation:**
```javascript
// validators/customValidator.js
const { body } = require('express-validator');

const validateProductInput = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .escape(), // Sanitize HTML
  
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be positive')
    .toFloat(),
  
  body('description')
    .trim()
    .isLength({ max: 1000 })
    .escape(),
];
```

### **9.4 Rate Limiting Strategy**

**Implement tiered rate limits:**
```javascript
// Different limits for different actions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 min
  message: 'Too many login attempts'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 API calls per 15 min
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 requests for unauthenticated
});
```

### **9.5 Database Security**

**MongoDB security checklist:**
- Enable authentication
- Use strong passwords
- Restrict network access (bind to localhost or VPC)
- Enable encryption at rest
- Regular backups
- Update regularly

**Connection string with auth:**
```env
MONGODB_URI=mongodb://admin:strongPassword@localhost:27017/auth-db?authSource=admin
```

### **9.6 HTTPS Enforcement**

**Redirect HTTP to HTTPS:**
```javascript
// Add to app.js in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

***

## **10. Versioning & Maintenance**

### **10.1 Branch Strategy**

```
main (production)
  ├── develop (staging)
  │   ├── feature/user-profile-enhancement
  │   ├── feature/oauth-linkedin
  │   └── bugfix/password-reset-email
  └── hotfix/security-patch
```

**Branch naming convention:**
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates

### **10.2 Version Numbering**

Follow Semantic Versioning (SemVer):
```
MAJOR.MINOR.PATCH

1.0.0 - Initial release
1.1.0 - New feature (backwards compatible)
1.1.1 - Bug fix (backwards compatible)
2.0.0 - Breaking changes
```

### **10.3 Update Strategy**

**Safe update process:**

1. **Review changelog**
2. **Backup database**
3. **Update dependencies:**
   ```bash
   npm outdated
   npm update
   ```
4. **Test in staging**
5. **Deploy to production**
6. **Monitor for issues**

**Database migrations:**
```javascript
// migrations/001-add-user-preferences.js
module.exports = {
  up: async (db) => {
    await db.collection('users').updateMany(
      { preferences: { $exists: false } },
      { $set: { preferences: { language: 'en', timezone: 'UTC' } } }
    );
  },
  
  down: async (db) => {
    await db.collection('users').updateMany(
      {},
      { $unset: { preferences: '' } }
    );
  }
};
```

### **10.4 Maintenance Checklist**

**Weekly:**
- Review error logs
- Check disk space
- Monitor response times
- Review failed login attempts

**Monthly:**
- Update dependencies (patch versions)
- Review and clean expired tokens
- Database optimization
- Security audit

**Quarterly:**
- Rotate JWT secrets
- Update Node.js version
- Full security audit
- Performance optimization

**Annually:**
- Major dependency updates
- Infrastructure review
- Disaster recovery testing
- Security penetration testing

***

## **11. FAQ**

**Q: Can I use this with a different database?**

A: Currently optimized for MongoDB. For PostgreSQL/MySQL, you'd need to replace Mongoose with Sequelize or Prisma and update models accordingly.

**Q: How do I add two-factor authentication?**

A: Implement TOTP (Time-based One-Time Password):
1. Install `speakeasy` and `qrcode` packages
2. Add `totpSecret` field to User model
3. Create setup and verify endpoints
4. Modify login flow to require TOTP

**Q: Can I customize the JWT payload?**

A: Yes, edit `config/jwt.js`:
```javascript
const generateAccessToken = (payload) => {
  return jwt.sign({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    customField: payload.customData  // Add custom fields
  }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};
```

**Q: How do I implement refresh token rotation?**

A: Already implemented! On refresh:
1. Old refresh token is invalidated
2. New access + refresh tokens issued
3. Old token marked as revoked in database

**Q: Can multiple users have the same email?**

A: No, email is unique by design. For social login, users are linked by email across providers.

**Q: How do I handle password strength requirements?**

A: Customize in `validators/authValidator.js`:
```javascript
body('password')
  .isLength({ min: 12 })  // Increase minimum
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/)
```

**Q: How do I implement account deletion grace period?**

A: Add `deletionScheduledAt` field to User model, mark for deletion instead of immediate delete, run cron job to permanently delete after grace period.

**Q: Can I use this with GraphQL?**

A: Yes! Create GraphQL resolvers that call the existing services:
```javascript
const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      return await userService.getUserProfile(context.userId);
    }
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      return await authService.loginUser({ email, password });
    }
  }
};
```

**Q: How do I implement WebSocket authentication?**

A: Verify JWT on WebSocket connection:
```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = verifyAccessToken(token);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});
```

**Q: What's the recommended way to handle file uploads with auth?**

A: Use multer with authentication:
```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/upload', 
  authenticate, 
  upload.single('file'), 
  uploadController.handleUpload
);
```

***

## **Conclusion**

This Enterprise Authentication Microservice provides a robust, scalable foundation for user authentication and authorization. By following this guide, you can integrate, customize, and deploy the service across various applications while maintaining security and best practices.[2][4][3]

For additional support, refer to:
- GitHub Issues: Report bugs and request features
- Community Forum: Ask questions and share solutions
- Official Documentation: https://docs.yourapp.com

**Happy coding!** 🚀

---

**Document Version:** 1.0.0  
**Last Updated:** November 19, 2025  
**Maintainer:** Enterprise Development Team

[1](https://vfunction.com/blog/guide-on-documenting-microservices/)
[2](https://www.osohq.com/learn/microservices-best-practices)
[3](https://www.geeksforgeeks.org/blogs/best-practices-for-microservices-architecture/)
[4](https://www.techtarget.com/searchapparchitecture/Guide-to-building-an-enterprise-API-strategy)
[5](https://microservices.io/patterns/microservices.html)
[6](https://swimm.io/learn/microservices/top-36-microservices-tools-for-2025)
[7](https://treblle.com/blog/essential-guide-api-documentation-best-practices-tools)
[8](https://www.microtica.com/blog/mastering-production-deployments)
[9](https://www.cloudbees.com/blog/documenting-microservices)
[10](https://codefresh.io/learn/software-deployment/)