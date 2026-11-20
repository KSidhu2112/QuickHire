const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getBearerToken = (authorization) => {
    if (typeof authorization !== 'string') return null;
    const match = authorization.match(/^Bearer\s+(\S+)$/i);
    return match ? match[1] : null;
};

const verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        const error = new Error('JWT_SECRET environment variable is required');
        error.code = 'JWT_SECRET_MISSING';
        throw error;
    }

    return jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
    });
};

const sendTokenError = (res, error) => {
    if (error.code === 'JWT_SECRET_MISSING') {
        console.error(error.message);
        return res.status(500).json({
            success: false,
            message: 'Authentication is not configured on the server.',
        });
    }

    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
        const expired = error.name === 'TokenExpiredError';
        return res.status(401).json({
            success: false,
            message: expired ? 'Session expired. Please login again.' : 'Not authorized. Invalid token.',
            code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        });
    }

    console.error('Authentication lookup failed:', error.message);
    return res.status(500).json({
        success: false,
        message: 'Unable to authenticate this request.',
    });
};

const protect = async (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Please login.',
            code: 'TOKEN_MISSING',
        });
    }

    try {
        const decoded = verifyToken(token);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.',
                code: 'USER_NOT_FOUND',
            });
        }

        return next();
    } catch (error) {
        return sendTokenError(res, error);
    }
};

const optionalProtect = async (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return next();

    try {
        const decoded = verifyToken(token);
        req.user = await User.findById(decoded.id);
    } catch (error) {
        // This middleware is used by public routes; an invalid optional token
        // does not turn a public request into an authentication failure.
        console.warn('Optional authentication ignored an invalid token.');
    }

    return next();
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This action requires ${allowedRoles.join(' or ')} role.`,
            });
        }

        return next();
    };
};

module.exports = { protect, optionalProtect, checkRole };
