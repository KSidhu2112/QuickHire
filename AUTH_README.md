# QuickHire - AI-Powered Job Platform 🚀

## Authentication System Setup ✅

### 🎉 What's Been Implemented

#### Backend (Node.js + Express + MongoDB)
- ✅ **MongoDB Integration** with Mongoose
- ✅ **User Model** with email verification
- ✅ **OTP Model** for email verification
- ✅ **JWT Authentication** (30-day token validity)
- ✅ **Email Service** using Brevo SMTP
- ✅ **Beautiful Email Templates** for OTP and Welcome emails
- ✅ **Password Hashing** with bcryptjs
- ✅ **Protected Routes** with authentication middleware

#### Frontend (React + Vite)
- ✅ **Login Modal** with email and password
- ✅ **Signup Modal** with 2-step OTP verification
- ✅ **API Service** with axios for backend communication
- ✅ **Toast Notifications** for user feedback
- ✅ **Responsive Design** for all screen sizes
- ✅ **Authentication State Management**
- ✅ **Auto-logout** functionality

---

## 🚀 How to Run

### Backend

```bash
cd backend
npm install
npm run dev
```

Server will run on: **http://localhost:5000**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## ⚠️ IMPORTANT: MongoDB Atlas Setup

### You need to whitelist your IP address in MongoDB Atlas:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Login with your credentials
3. Select your cluster (**Cluster0**)
4. Click on **Network Access** (left sidebar)
5. Click **"+ ADD IP ADDRESS"**
6. Click **"ADD CURRENT IP ADDRESS"**
7. Click **"Confirm"**

**Alternatively, for development:**
- Click **"ALLOW ACCESS FROM ANYWHERE"**
- Enter `0.0.0.0/0` as the IP address
- ⚠️ **Note**: This is only for development, not production!

---

## 📧 Email Configuration (Already Setup)

- **SMTP Provider**: Brevo (Sendinblue)
- **Sender Email**: kurvasidhu2112@gmail.com
- **SMTP Server**: smtp-relay.brevo.com:587

All credentials are configured in `.env` file.

---

## 🔑 Authentication Flow

### Registration:
1. User enters **Name, Email, Password, Role**
2. Click **"Send OTP"**
3. System sends **6-digit OTP** to email
4. User enters OTP (valid for 10 minutes)
5. Click **"Verify & Register"**
6. Account created + Welcome email sent
7. Auto-login with JWT token

### Login:
1. User enters **Email** and **Password**
2. System verifies credentials
3. Checks if email is verified
4. Issues JWT token (30 days)
5. Redirects to home page

---

## 📁 Backend Structure

```
backend/
├── models/
│   ├── User.js          # User schema with authentication
│   └── OTP.js           # OTP schema with auto-expiry
├── controllers/
│   └── authController.js # Auth logic (register, login, OTP)
├── middleware/
│   └── authMiddleware.js # JWT verification
├── routes/
│   └── authRoutes.js    # API endpoints
├── utils/
│   └── emailService.js  # Email sending with templates
├── .env                 # Environment variables
├── server.js            # Express server setup
└── package.json         # Dependencies

```

## 📁 Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx       # Nav with auth modals
│   │   ├── Navbar.css
│   │   ├── Footer.jsx
│   │   └── Footer.css
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Home.css
│   │   ├── Login.jsx        # Login modal
│   │   ├── Signup.jsx       # Signup with OTP
│   │   └── Auth.css         # Auth styles
│   ├── services/
│   │   └── api.js           # API calls + axios setup
│   ├── assets/
│   │   └── logo.png
│   ├── App.jsx
│   └── index.css
└── package.json
```

---

## 🔗 API Endpoints

### Public Routes
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/register` - Register with OTP verification
- `POST /api/auth/login` - Login with email/password

### Protected Routes
- `GET /api/auth/me` - Get current user profile

---

## 🎨 Features

### Frontend
- ✨ **Modern UI** with gradients and animations
- 🎯 **Modal-based** authentication (no page redirects)
- ⏱️ **OTP Timer** with resend functionality
- 🔔 **Toast Notifications** for all actions
- 📱 **Fully Responsive** design
- 🎭 **Conditional Rendering** (Login/Logout buttons)
- 🎨 **Glassmorphism** effects

### Backend
- 🔐 **Secure Password** hashing
- 📧 **Beautiful HTML Emails**
- ⏰ **Auto-expiring** OTPs (10 minutes)
- 🎫 **JWT Tokens** (30 days)
- ✅ **Email Verification** required
- 🛡️ **Protected Routes** middleware
- 📊 **Role-based** system (jobseeker, employer, admin)

---

## 🧪 Testing the Authentication

1. **Start Backend** (after whitelisting IP)
2. **Start Frontend**
3. Open browser: `http://localhost:5173`
4. Click **"Sign Up"**
5. Fill in details and click **"Send OTP"**
6. Check your email for OTP
7. Enter OTP and click **"Verify & Register"**
8. Welcome! You're logged in!

---

## 🎯 Next Steps

1. ✅ **Fix MongoDB Connection** (whitelist IP)
2. 🚀 **Test Registration Flow**
3. 🔐 **Test Login Flow**
4. 📊 **Build Dashboard** for logged-in users
5. 💼 **Add Job Posting** features
6. 🤖 **Integrate AI** matching

---

## 📝 Environment Variables

All configured in `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=quickhire_super_secret_key_2026
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=91e0c3002@smtp-brevo.com
SMTP_PASSWORD=xsmtpsib-fff7911c...
SENDER_EMAIL=kurvasidhu2112@gmail.com
OTP_EXPIRY_MINUTES=10
```

---

## 🐛 Troubleshooting

### Backend won't start?
- Check if MongoDB IP is whitelisted
- Verify `.env` file exists and has correct values
- Run `npm install` again

### OTP not received?
- Check spam folder
- Verify Brevo SMTP credentials
- Check backend console for errors

### Login not working?
- Make sure you registered with OTP first
- Check if email is verified
- Verify password is correct (min 6 characters)

---

## 📞 Support

- **Your Email**: kurvasidhu2112@gmail.com
- **MongoDB**: Cluster0.kvkshtz.mongodb.net
- **Database Name**: quickhire

---

Built with ❤️ using MERN Stack + OTP Authentication
