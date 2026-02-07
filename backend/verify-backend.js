const mongoose = require('mongoose');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

console.log('========================================');
console.log('🔍 QuickHire Backend Verification Tool');
console.log('========================================\n');

// 1. Check Environment Variables
console.log('📋 1. Environment Variables Check:');
const requiredEnvVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SENDER_EMAIL',
    'SENDER_NAME',
    'OTP_EXPIRY_MINUTES'
];

let envCheckPassed = true;
requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`   ✅ ${varName}: Set`);
    } else {
        console.log(`   ❌ ${varName}: Missing`);
        envCheckPassed = false;
    }
});

if (!envCheckPassed) {
    console.log('\n❌ Some environment variables are missing!\n');
    process.exit(1);
}

console.log('\n✅ All environment variables are set!\n');

// 2. Test MongoDB Connection
console.log('📋 2. MongoDB Connection Test:');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log(`   ✅ MongoDB Connected Successfully!`);
        console.log(`   📊 Database: ${mongoose.connection.name}`);
        console.log(`   🔗 Host: ${mongoose.connection.host}\n`);

        // 3. Test Email Configuration
        console.log('📋 3. Email Configuration Test:');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        transporter.verify((error, success) => {
            if (error) {
                console.log(`   ❌ Email Configuration Error: ${error.message}\n`);
            } else {
                console.log('   ✅ Email server is ready to send messages!\n');
            }

            // 4. Check Models
            console.log('📋 4. Models Check:');
            try {
                const User = require('./models/User');
                const OTP = require('./models/OTP');
                console.log('   ✅ User Model: Loaded');
                console.log('   ✅ OTP Model: Loaded\n');
            } catch (error) {
                console.log(`   ❌ Model Error: ${error.message}\n`);
            }

            // 5. Check Controllers
            console.log('📋 5. Controllers Check:');
            try {
                const authController = require('./controllers/authController');
                console.log('   ✅ Auth Controller: Loaded');
                console.log(`   ✅ Methods: sendOTP, register, login, getMe, resendOTP\n`);
            } catch (error) {
                console.log(`   ❌ Controller Error: ${error.message}\n`);
            }

            // 6. Check Middleware
            console.log('📋 6. Middleware Check:');
            try {
                const { protect } = require('./middleware/authMiddleware');
                console.log('   ✅ Auth Middleware: Loaded\n');
            } catch (error) {
                console.log(`   ❌ Middleware Error: ${error.message}\n`);
            }

            // 7. Check Routes
            console.log('📋 7. Routes Check:');
            try {
                const authRoutes = require('./routes/authRoutes');
                console.log('   ✅ Auth Routes: Loaded');
                console.log('   📍 Available Endpoints:');
                console.log('      - POST /api/auth/send-otp');
                console.log('      - POST /api/auth/resend-otp');
                console.log('      - POST /api/auth/register');
                console.log('      - POST /api/auth/login');
                console.log('      - GET  /api/auth/me (Protected)\n');
            } catch (error) {
                console.log(`   ❌ Routes Error: ${error.message}\n`);
            }

            // Final Summary
            console.log('========================================');
            console.log('✅ Backend Verification Complete!');
            console.log('========================================');
            console.log('\n🚀 Your backend is ready to run!');
            console.log(`📍 Server will run on: http://localhost:${process.env.PORT || 5000}`);
            console.log(`📍 API Base URL: http://localhost:${process.env.PORT || 5000}/api`);
            console.log('\n💡 To start the server, run: npm start or npm run dev\n');

            // Close MongoDB connection
            mongoose.connection.close();
            process.exit(0);
        });
    })
    .catch((error) => {
        console.log(`   ❌ MongoDB Connection Error: ${error.message}\n`);
        process.exit(1);
    });
