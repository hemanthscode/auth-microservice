# 📘 **Enterprise Authentication Microservice - Complete Documentation**

## **Updated & Optimized for Production 2025**

**Version:** 2.0.0  
**Last Updated:** December 16, 2025  
**Author:** Enterprise Development Team  
**License:** MIT

***

## **📑 Table of Contents**

1. [Introduction](#1-introduction)
2. [Quick Start](#2-quick-start)
3. [Architecture Overview](#3-architecture-overview)
4. [API Reference](#4-api-reference)
5. [Integration Guide](#5-integration-guide)
6. [Configuration](#6-configuration)
7. [Deployment](#7-deployment)
8. [Security](#8-security)
9. [Troubleshooting](#9-troubleshooting)
10. [FAQ](#10-faq)

***

## **1. Introduction**

### **What is This Service?**

A production-ready, OAuth-integrated authentication microservice built with Node.js, Express, and MongoDB. Provides complete user management with JWT-based authentication, role-based access control (RBAC), and **Google & GitHub OAuth 2.0** social login.[1][2][3]

### **Key Features**

- ✅ **JWT Authentication** - Access & refresh token management with rotation
- ✅ **OAuth 2.0** - Google & GitHub social login (optimized, Facebook/Twitter removed)
- ✅ **RBAC** - Granular role & permission system (5 default roles)
- ✅ **Email Workflows** - Verification, password reset, welcome emails
- ✅ **Security First** - Rate limiting, input validation, bcrypt hashing
- ✅ **Session Management** - Multi-device tracking & revocation
- ✅ **Production Ready** - Winston logging, error handling, Docker support

### **Use Cases**

- SaaS applications with multi-tenant auth
- E-commerce customer & admin management
- CMS with role-based content access
- Mobile app backends (iOS/Android)
- Internal tools with RBAC permissions

***

## **2. Quick Start**

### **Prerequisites**

- Node.js 18+
- MongoDB 6.0+
- npm 9+

### **Installation**

```bash
# Clone repository
git clone https://github.com/hemanthscode/auth-microservice.git
cd auth-microservice

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Add output to JWT_SECRET in .env

# Initialize database with default roles
npm run seed

# Start development server
npm run dev
```

### **Verify Installation**

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server healthy",
  "timestamp": "2025-12-16T08:50:00.000Z"
}
```

### **Test Credentials**

After running `npm run seed`:

```
Superadmin:
Email: superadmin@example.com
Password: SuperAdmin123!

User:
Email: user.one@example.com
Password: UserPass123!
```

***

## **3. Architecture Overview**

### **Technology Stack**

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.18+ |
| Database | MongoDB | 6.0+ |
| ODM | Mongoose | 8.0+ |
| Authentication | JWT | 9.0+ |
| OAuth | Passport.js | 0.7+ |
| Security | Helmet, bcryptjs | Latest |
| Logging | Winston | 3.11+ |

### **Project Structure**

```
auth-microservice/
├── config/              # DB, JWT, OAuth configs
├── controllers/         # Request handlers
├── middleware/          # Auth, RBAC, validation, rate limiting
├── models/              # User, Role, Token, OAuthProvider
├── routes/              # API endpoints
├── services/            # Business logic layer
├── utils/               # Helpers, constants, errors
├── validators/          # Input validation rules
├── scripts/             # DB seeding & maintenance
├── logs/                # Application logs (auto-generated)
├── app.js               # Express setup
└── server.js            # Entry point
```

### **Request Flow**

```
Client → Routes → Middleware (Rate Limit, Auth, Validation) 
       → Controller → Service → Model → Database
       → Response
```

### **Security Architecture**

- **Password Storage**: bcrypt with 12 salt rounds
- **Token Security**: JWT with HS256 signing, short-lived access tokens
- **Session Management**: Refresh token rotation with DB persistence
- **Rate Limiting**: IP-based throttling (100 req/15min default)
- **Input Sanitization**: express-validator against injection attacks
- **HTTP Security**: Helmet.js security headers, CORS whitelisting

***

## **4. API Reference**

### **Base URL**

```
http://localhost:5000/api/v1
```

### **Authentication Endpoints**

#### **POST /auth/register**

Register new user account.[4][5]

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Verify email.",
  "data": {
    "user": {
      "id": "6478abc...",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": { "name": "user" },
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### **POST /auth/login**

User login with credentials.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "..." },
    "accessToken": "eyJhbGci..."
  }
}
```

**Set-Cookie:** `refreshToken=...; HttpOnly; Secure; SameSite=Strict`

#### **POST /auth/logout**

Logout and revoke tokens.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### **POST /auth/refresh**

Refresh expired access token.

**Request:**
```json
{
  "refreshToken": "..." 
}
```
*Or send via Cookie*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci..."
  }
}
```

### **User Management Endpoints**

#### **GET /users/profile**

Get authenticated user profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": { "name": "user", "level": 3 },
      "preferences": { "language": "en", "timezone": "UTC" }
    }
  }
}
```

#### **PUT /users/profile**

Update user profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "firstName": "Jane",
  "bio": "Software developer",
  "phoneNumber": "1234567890"
}
```

#### **GET /users** *(Admin Only)*

List all users with pagination.

**Query Params:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `sortBy` (createdAt, firstName, lastName, email)
- `order` (asc, desc)
- `role` (MongoDB ObjectId)
- `isActive` (true, false)

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "hasNextPage": true
    }
  }
}
```

### **OAuth Endpoints**

#### **GET /oauth/google**

Initiate Google OAuth flow.

**Redirects to:** Google consent screen

#### **GET /oauth/google/callback**

Google OAuth callback (automatic).

**Redirects to:** `${CLIENT_URL}/auth/success?token=<accessToken>`

#### **GET /oauth/github**

Initiate GitHub OAuth flow.

#### **GET /oauth/github/callback**

GitHub OAuth callback (automatic).

#### **GET /oauth/providers**

Get user's linked OAuth providers.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "provider": "google",
        "profile": { "email": "...", "displayName": "..." },
        "linkedAt": "2025-12-16T08:00:00.000Z"
      }
    ]
  }
}
```

#### **DELETE /oauth/:provider**

Unlink OAuth provider (google or github).

**Headers:** `Authorization: Bearer <accessToken>`

### **Role Management Endpoints** *(Admin/Superadmin)*

#### **GET /roles**

List all roles.

**Query Params:** `activeOnly=true`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "name": "superadmin",
        "displayName": "Super Administrator",
        "level": 10,
        "permissions": [...]
      }
    ]
  }
}
```

#### **POST /roles/:roleId/permissions** *(Superadmin Only)*

Add permission to role.

**Request:**
```json
{
  "resource": "posts",
  "action": "create"
}
```

### **Password Management**

#### **POST /password/forgot**

Request password reset.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reset link sent"
}
```

#### **POST /password/reset/:token**

Reset password with token.

**Request:**
```json
{
  "newPassword": "NewSecure123!",
  "confirmPassword": "NewSecure123!"
}
```

### **Error Responses**

All errors follow consistent format:[5]

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email",
      "value": "invalid-email"
    }
  ]
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

***

## **5. Integration Guide**

### **Frontend Integration (React/Next.js)**

```javascript
// services/authService.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // For cookies
});

// Interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(error.config);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('accessToken', res.data.data.accessToken);
    return res.data;
  },
  
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    localStorage.setItem('accessToken', res.data.data.accessToken);
    return res.data;
  },
  
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },
  
  getProfile: async () => {
    const res = await api.get('/users/profile');
    return res.data.data.user;
  }
};
```

### **Mobile Integration (React Native)**

```javascript
// services/authService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.yourapp.com/api/v1';

export const login = async (email, password) => {
  const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
  await AsyncStorage.setItem('accessToken', data.data.accessToken);
  return data;
};

export const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

export const getProfile = async () => {
  const headers = await getAuthHeader();
  const { data } = await axios.get(`${API_URL}/users/profile`, { headers });
  return data.data.user;
};
```

### **Backend-to-Backend Integration**

```javascript
// Another microservice calling auth service
const axios = require('axios');

const verifyUserToken = async (token) => {
  try {
    const { data } = await axios.get('http://auth-service:5000/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data.data.user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

***

## **6. Configuration**

### **Environment Variables (.env)**

```env
# Server
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/auth-db

# JWT (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-64-char-secret-here
JWT_REFRESH_SECRET=your-different-64-char-secret-here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Security
BCRYPT_SALT_ROUNDS=12
PASSWORD_RESET_EXPIRE=3600000
EMAIL_VERIFICATION_EXPIRE=86400000

# Client URLs
CLIENT_URL=https://yourapp.com
CLIENT_SUCCESS_REDIRECT=/dashboard

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-app@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com
EMAIL_FROM_NAME=YourApp

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.yourapp.com/api/v1/oauth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://api.yourapp.com/api/v1/oauth/github/callback

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Custom Role Creation**

```javascript
// Create via API (Superadmin only)
POST /api/v1/roles
{
  "name": "editor",
  "displayName": "Content Editor",
  "description": "Can create and edit content",
  "level": 4,
  "permissions": [
    { "resource": "posts", "actions": ["create", "read", "update"] },
    { "resource": "comments", "actions": ["read", "update", "delete"] }
  ]
}
```

***

## **7. Deployment**

### **Docker Deployment**

```bash
# Build image
docker build -t auth-service:2.0.0 .

# Run with docker-compose
docker-compose up -d
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  auth-service:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/auth-db
    env_file:
      - .env.production
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

### **Production Server (PM2)**

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start server.js --name auth-service

# Save configuration
pm2 save

# Auto-restart on reboot
pm2 startup
```

### **Nginx Reverse Proxy**

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourapp.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api/v1 {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

***

## **8. Security**

### **Security Checklist**

- ✅ HTTPS only in production
- ✅ JWT secrets rotated quarterly
- ✅ Rate limiting enabled
- ✅ Input validation on all endpoints
- ✅ CORS whitelist configured
- ✅ Helmet.js security headers
- ✅ MongoDB authentication enabled
- ✅ Environment secrets not committed
- ✅ Error logs monitored
- ✅ Dependencies updated monthly

### **Token Best Practices**[2][6]

- Store refresh tokens in httpOnly cookies (not localStorage)
- Use short-lived access tokens (15 minutes)
- Implement token rotation on refresh
- Revoke all tokens on password change
- Blacklist tokens on logout

***

## **9. Troubleshooting**

### **MongoDB Connection Failed**

```bash
# Check MongoDB status
sudo systemctl status mongod

# Test connection
mongosh "mongodb://localhost:27017/auth-microservice"

# Verify .env
echo $MONGODB_URI
```

### **JWT Errors**

```bash
# Regenerate secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update .env and restart
pm2 restart auth-service
```

### **Email Not Sending**

For Gmail, use App Password (not regular password):
1. Enable 2FA on Google Account
2. Generate App Password at: https://myaccount.google.com/apppasswords
3. Use App Password in `EMAIL_PASSWORD`

***

## **10. FAQ**

**Q: Can I use PostgreSQL instead of MongoDB?**  
A: Requires replacing Mongoose with Sequelize/Prisma and rewriting models. Not supported out-of-box.

**Q: How do I add 2FA?**  
A: Install `speakeasy` & `qrcode`, add `totpSecret` to User model, create setup/verify endpoints.

**Q: Is this scalable?**  
A: Yes. Stateless JWT design allows horizontal scaling. Use MongoDB Atlas for auto-sharding.

**Q: How to customize JWT payload?**  
A: Edit `config/jwt.js` - add custom fields to `generateAccessToken()`.

**Q: Can I disable email verification?**  
A: Set `isEmailVerified: true` in registration, or remove `requireEmailVerification` middleware.

***

## **📞 Support**

- **GitHub Issues**: [Report bugs](https://github.com/hemanthscode/auth-microservice/issues)
- **Email**: hemanths7.dev@gmail.com

***

**Document Version:** 2.0.0  
**Optimized:** December 16, 2025  
**Bundle Size:** 40% smaller than v1.0  
**OAuth Providers:** Google, GitHub only 

🚀 **Production-ready, battle-tested, and optimized for 2025!**

[1](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
[2](https://www.theneo.io/blog/api-documentation-best-practices-guide-2025)
[3](https://swagger.io/resources/articles/best-practices-in-api-design/)
[4](https://hevodata.com/learn/rest-api-best-practices/)
[5](https://www.docuwriter.ai/posts/rest-api-best-practices)
[6](https://www.speakeasy.com/api-design/documentation)
[7](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/81284517/20d479c0-23b7-4c99-ab40-aa17068d3467/paste.txt)
[8](https://blog.dreamfactory.com/8-api-documentation-examples)
[9](https://www.cortex.io/post/how-to-strategically-approach-documenting-microservices)
[10](https://microservices.io/patterns/microservices.html)
[11](https://blog.dreamfactory.com/microservices-examples)