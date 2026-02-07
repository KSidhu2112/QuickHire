const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        console.log('🔐 Auth Check - Headers:', req.headers.authorization ? 'Present' : 'Missing');

        // Check for token in headers
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
            console.log('✅ Token extracted:', token ? 'Yes' : 'No');
        }

        // Check if token exists
        if (!token) {
            console.log('❌ No token found in request');
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token verified. User ID:', decoded.id);

        // Get user from token
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            console.log('❌ User not found for ID:', decoded.id);
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        console.log('✅ User authenticated:', req.user.email, 'Role:', req.user.role);
        next();
    } catch (error) {
        console.error('❌ Auth Middleware Error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Invalid token.',
            error: error.message,
        });
    }
};

const optionalProtect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        console.warn('Optional Auth Error:', error.message);
        next();
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            console.log(`❌ Role access denied. User role: ${req.user.role}, Allowed: ${roles}`);
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`,
            });
        }
        next();
    };
};

module.exports = { protect, optionalProtect, checkRole };
