const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock user storage (in-memory for testing)
const users = [];
const otps = {};

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'QuickHire Backend is running (TEST MODE - No MongoDB)',
        mode: 'TEST'
    });
});

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email, name } = req.body;

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP (in memory)
        otps[email] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        };

        console.log(`📧 OTP for ${email}: ${otp}`);

        res.json({
            success: true,
            message: 'OTP sent successfully (check console)',
            otp: otp, // In real app, don't send OTP in response!
            expiresIn: 10,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Register (mock)
app.post('/api/auth/register', (req, res) => {
    try {
        const { name, email, password, otp } = req.body;

        // Check OTP
        const storedOTP = otps[email];
        if (!storedOTP || storedOTP.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (storedOTP.expiresAt < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        // Create mock user
        const user = {
            id: Date.now().toString(),
            name,
            email,
            role: req.body.role || 'jobseeker',
            isEmailVerified: true,
        };

        users.push(user);
        delete otps[email];

        // Mock JWT token
        const token = Buffer.from(JSON.stringify(user)).toString('base64');

        console.log(`✅ User registered: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login (mock)
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;

        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Mock JWT token
        const token = Buffer.from(JSON.stringify(user)).toString('base64');

        console.log(`✅ User logged in: ${email}`);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resend OTP
app.post('/api/auth/resend-otp', (req, res) => {
    try {
        const { email } = req.body;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        otps[email] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
        };

        console.log(`📧 New OTP for ${email}: ${otp}`);

        res.json({
            success: true,
            message: 'New OTP sent',
            otp: otp, // In real app, don't send OTP in response!
            expiresIn: 10,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('🧪 TEST MODE - No MongoDB Connection');
    console.log('🚀 Server running on port', PORT);
    console.log('🌐 API:', `http://localhost:${PORT}/api`);
    console.log('📝 OTPs will be shown in console');
    console.log('⚠️  This is for TESTING only - data won\'t persist!');
});
