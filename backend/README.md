# QuickHire Backend - Setup & Configuration Guide

## 🎯 Overview
QuickHire backend is a robust authentication system built with Node.js, Express, MongoDB, and JWT. It includes email OTP verification using Brevo SMTP.

## 📋 Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- Brevo account for email services

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
All required environment variables are already configured in `.env`:
- ✅ PORT=5000
- ✅ MONGODB_URI (MongoDB Atlas connection string)
- ✅ JWT_SECRET (for token generation)
- ✅ SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (Brevo SMTP)
- ✅ SENDER_EMAIL, SENDER_NAME (Email sender details)
- ✅ OTP_EXPIRY_MINUTES=10

### 3. Start the Server
```bash
npm start
# or
npm run dev
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
- **GET** `/api/health`
  - Check if the backend is running

### Authentication Endpoints

#### 1. Send OTP
- **POST** `/api/auth/send-otp`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "OTP sent successfully to your email",
    "expiresIn": 10
  }
  ```

#### 2. Resend OTP
- **POST** `/api/auth/resend-otp`
- **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

#### 3. Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "securePassword123",
    "otp": "123456",
    "role": "jobseeker"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Registration successful!",
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "jobseeker",
      "isEmailVerified": true
    }
  }
  ```

#### 4. Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Login successful!",
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "jobseeker",
      "isEmailVerified": true
    }
  }
  ```

#### 5. Get Current User (Protected)
- **GET** `/api/auth/me`
- **Headers:**
  ```
  Authorization: Bearer <jwt_token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "jobseeker",
      "isEmailVerified": true,
      "phone": null,
      "profile": {},
      "createdAt": "2026-01-31T..."
    }
  }
  ```

## 🏗️ Project Structure

```
backend/
├── controllers/
│   └── authController.js      # Authentication logic
├── middleware/
│   └── authMiddleware.js      # JWT verification middleware
├── models/
│   ├── User.js                # User schema
│   └── OTP.js                 # OTP schema
├── routes/
│   └── authRoutes.js          # API routes
├── utils/
│   └── emailService.js        # Email sending utilities
├── .env                       # Environment variables
├── server.js                  # Main server file
└── package.json               # Dependencies
```

## 🔐 Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Authentication**: Secure token-based authentication with 30-day expiry
3. **Email Verification**: OTP-based email verification before account activation
4. **Protected Routes**: Middleware to protect private endpoints
5. **OTP Expiry**: OTPs automatically expire after 10 minutes

## 🗄️ Database Models

### User Model
- name (required, min 2 characters)
- email (required, unique, validated)
- password (required, min 6 characters, hashed)
- role (jobseeker/employer/admin)
- isEmailVerified (boolean)
- phone (optional)
- profile (avatar, bio, skills, experience, education, resume)
- timestamps

### OTP Model
- email (required)
- otp (required, 6-digit)
- purpose (registration/password-reset/email-verification)
- expiresAt (auto-delete when expired)
- Auto-deletes after 10 minutes

## 🧪 Testing the Backend

### Using cURL

**Send OTP:**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "password":"test1234",
    "otp":"123456",
    "role":"jobseeker"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

### Using Postman
1. Import the API endpoints
2. Set base URL to `http://localhost:5000`
3. For protected routes, add header: `Authorization: Bearer <token>`

## 📧 Email Templates

The backend includes beautifully designed HTML email templates:
1. **OTP Verification Email** - Professional gradient design with security warnings
2. **Welcome Email** - Sent after successful registration

## ✅ Backend Status

### Current Status: ✅ FULLY CONFIGURED

- ✅ Environment variables configured
- ✅ MongoDB connection setup (Atlas)
- ✅ Email service configured (Brevo SMTP)
- ✅ User model with password hashing
- ✅ OTP model with auto-expiry
- ✅ Authentication controller (sendOTP, register, login, getMe, resendOTP)
- ✅ JWT middleware for protected routes
- ✅ Email service utilities
- ✅ All routes configured

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB URI is correct in `.env`
- Check if your IP is whitelisted in MongoDB Atlas
- Verify network connectivity

### Email Not Sending
- Verify Brevo SMTP credentials in `.env`
- Check SMTP_HOST and SMTP_PORT values
- Ensure sender email is verified in Brevo

### OTP Not Working
- Check if OTP has expired (10 minutes)
- Ensure email matches between send-otp and register
- Verify OTP is exactly 6 digits

## 🚀 Ready to Use!

Your backend is fully configured and ready to use. Simply run:

```bash
npm start
```

And connect your frontend to:
- **Base URL:** `http://localhost:5000`
- **API Base:** `http://localhost:5000/api`
- **Auth Endpoints:** `http://localhost:5000/api/auth`

## 📝 Notes

- JWT tokens expire after 30 days
- OTPs expire after 10 minutes
- Database: QuickHire on MongoDB Atlas
- Email service: Brevo SMTP
- Default role: jobseeker
- Email verification required before login
