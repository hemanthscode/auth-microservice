# Authentication Microservice

A backend authentication service built with **Node.js, Express, and MongoDB**, implementing **JWT-based authentication**, **role-based access control (RBAC)**, and **OAuth login with Google and GitHub**.

This project focuses on **backend fundamentals**, security best practices, and clean service architecture suitable for modern web applications.

---

## 🚀 Features

* **JWT Authentication**

  * Access and refresh tokens
  * Token rotation and revocation

* **OAuth 2.0**

  * Google and GitHub social login

* **Role-Based Access Control (RBAC)**

  * Predefined roles with permission levels
  * Protected routes using middleware

* **User Management**

  * Registration and login
  * Email verification
  * Password reset workflow

* **Security Measures**

  * Password hashing with bcrypt
  * Rate limiting
  * Input validation
  * Secure HTTP headers

---

## 🧠 Why This Project

Most applications require secure and scalable authentication.
This project demonstrates how to design and implement a **dedicated authentication service** that can be reused across multiple applications (web or mobile).

It emphasizes:

* Separation of concerns
* Stateless authentication using JWT
* Secure session handling
* Practical backend patterns used in real systems

---

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB
* **ODM:** Mongoose
* **Authentication:** JWT
* **OAuth:** Passport.js
* **Security:** bcrypt, Helmet, express-rate-limit

---

## 📁 Project Structure

```
auth-microservice/
├── config/              # Database, JWT, OAuth configuration
├── controllers/         # Request handlers
├── middleware/          # Auth, RBAC, validation, rate limiting
├── models/              # User, Role, Token schemas
├── routes/              # API routes
├── services/            # Business logic layer
├── utils/               # Helpers and shared utilities
├── validators/          # Request validation rules
├── scripts/             # Database seeding scripts
├── app.js               # Express app setup
└── server.js            # Server entry point
```

---

## ⚙️ How It Works (High Level)

1. Client authenticates via credentials or OAuth
2. Server issues a short-lived access token and refresh token
3. Protected routes validate access tokens via middleware
4. Refresh tokens are rotated and stored securely
5. RBAC middleware restricts access based on user roles

---

## ▶️ Running Locally

### Prerequisites

* Node.js (18+)
* MongoDB (local or cloud)

### Setup

```bash
git clone https://github.com/hemanthscode/auth-microservice.git
cd auth-microservice
npm install
```

Create a `.env` file based on `.env.example` and add required values.

Start the server:

```bash
npm run dev
```

Health check:

```bash
GET http://localhost:5000/health
```

---

## 🔐 Security Notes

* Passwords are hashed using bcrypt
* Refresh tokens are stored securely and rotated
* Rate limiting is enabled to prevent abuse
* Input validation is applied to all endpoints

This project is intended for **learning and demonstration purposes**.
Always review and adapt security practices before using in production systems.

---

## 📈 Possible Enhancements

* Two-factor authentication (2FA)
* Account lockout on repeated failures
* Audit logs for authentication events
* Centralized API documentation (OpenAPI / Swagger)

---

## 📄 License

MIT License

---

## 👤 Maintained By

**Hemanth S**
MCA Student | Backend & Web Developer