const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

// Check if MongoDB is connected
const checkMongoConnection = () => {
    if (mongoose.connection.readyState !== 1) {
        return {
            connected: false,
            error: {
                success: false,
                message: 'Database not available. Please ensure your database is running or whitelist your IP in MongoDB Atlas.',
                details: 'Visit: https://cloud.mongodb.com/v2#/security/network/accessList',
                action: 'Check your internet connection and MongoDB Atlas IP whitelist'
            }
        };
    }
    return { connected: true };
};

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send OTP for registration
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
    try {
        // Check MongoDB connection first
        const mongoCheck = checkMongoConnection();
        if (!mongoCheck.connected) {
            return res.status(503).json(mongoCheck.error);
        }

        const { email, name } = req.body;

        // Validate input
        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and name',
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered. Please login.',
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Delete any existing OTPs for this email
        await OTP.deleteMany({ email });

        // Save new OTP
        await OTP.create({
            email,
            otp,
            purpose: 'registration',
            expiresAt,
        });

        // Send OTP email
        await sendOTPEmail(email, otp, 'registration');

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your email',
            expiresIn: expiryMinutes,
        });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.',
            error: error.message,
        });
    }
};

// @desc    Register user with OTP verification
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        // Check MongoDB connection first
        const mongoCheck = checkMongoConnection();
        if (!mongoCheck.connected) {
            return res.status(503).json(mongoCheck.error);
        }

        const { name, email, password, otp, role } = req.body;

        console.log('📝 Registration attempt:', { email, name, role });

        // Validate input
        if (!name || !email || !password || !otp) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }

        // Verify OTP
        console.log('🔍 Verifying OTP for:', email);
        const otpRecord = await OTP.findOne({
            email,
            otp,
            purpose: 'registration',
        });

        if (!otpRecord) {
            console.log('❌ Invalid OTP');
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please check and try again.',
            });
        }

        // Check if OTP expired
        if (otpRecord.expiresAt < new Date()) {
            console.log('❌ OTP expired');
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.',
            });
        }

        console.log('✅ OTP verified successfully');

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('❌ User already exists');
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // Create user
        console.log('👤 Creating user...');
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'jobseeker',
            isEmailVerified: true,
        });
        console.log('✅ User created:', user._id);

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });
        console.log('✅ OTP deleted');

        // Send welcome email (non-blocking - don't fail registration if email fails)
        console.log('📧 Attempting to send welcome email...');
        sendWelcomeEmail(email, name)
            .then(() => {
                console.log('✅ Welcome email sent successfully');
            })
            .catch((err) => {
                console.error('⚠️  Welcome email failed (non-critical):', err.message);
                // Don't throw - registration should still succeed
            });

        // Generate token
        const token = generateToken(user._id);
        console.log('✅ Registration complete for:', email);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            },
        });
    } catch (error) {
        console.error('❌ Registration Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            error: error.message,
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        // Check MongoDB connection first
        const mongoCheck = checkMongoConnection();
        if (!mongoCheck.connected) {
            return res.status(503).json(mongoCheck.error);
        }

        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check password
        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in',
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
            error: error.message,
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                phone: user.phone,
                profile: user.profile,
                createdAt: user.createdAt,
                trustScore: user.trustScore,
                stats: user.stats,
                badges: user.badges,
            },
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message,
        });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
    try {
        // Check MongoDB connection first
        const mongoCheck = checkMongoConnection();
        if (!mongoCheck.connected) {
            return res.status(503).json(mongoCheck.error);
        }

        const { email, purpose = 'registration' } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email',
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Delete old OTPs for this purpose
        await OTP.deleteMany({ email, purpose });

        // Save new OTP
        await OTP.create({
            email,
            otp,
            purpose,
            expiresAt,
        });

        // Send OTP email
        await sendOTPEmail(email, otp, purpose);

        res.status(200).json({
            success: true,
            message: `New OTP sent successfully for ${purpose.replace('-', ' ')}`,
            expiresIn: expiryMinutes,
        });
    } catch (error) {
        console.error('Resend OTP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: error.message,
        });
    }
};
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const { name, phone, profile } = req.body;

        // Update fields if provided
        if (name) user.name = name;
        if (phone) user.phone = phone;

        // Update profile sub-document fields
        if (profile) {
            user.profile = {
                ...user.profile, // Keep existing profile fields
                ...profile,      // Overwrite with new fields
            };
        }

        await user.save();

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                phone: user.phone,
                profile: user.profile,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide email' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Delete existing OTPs
        await OTP.deleteMany({ email, purpose: 'password-reset' });

        // Save new OTP
        await OTP.create({
            email,
            otp,
            purpose: 'password-reset',
            expiresAt
        });

        // Send Email
        await sendOTPEmail(email, otp, 'password-reset');

        res.status(200).json({
            success: true,
            message: 'Password reset OTP sent to your email'
        });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
    }
};

// @desc    Reset Password - Verify OTP and update password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide all fields' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Verify OTP
        const otpRecord = await OTP.findOne({
            email,
            otp,
            purpose: 'password-reset'
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        // Update User Password
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login.'
        });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
    }
};
