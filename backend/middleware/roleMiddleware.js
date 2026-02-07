// Middleware to check if user has required role(s)
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }

        // Convert single role to array
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This action requires ${allowedRoles.join(' or ')} role.`,
            });
        }

        next();
    };
};

// Middleware to check if user is the owner of a resource
const checkResourceOwner = (Model, resourceIdParam = 'id', ownerField = 'user') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceIdParam];
            const resource = await Model.findById(resourceId);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found',
                });
            }

            // Check if user is the owner
            const ownerId = resource[ownerField].toString();
            const userId = req.user._id.toString();

            if (ownerId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You do not own this resource.',
                });
            }

            // Attach resource to request for use in controller
            req.resource = resource;
            next();
        } catch (error) {
            console.error('Resource ownership check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking resource ownership',
                error: error.message,
            });
        }
    };
};

module.exports = {
    checkRole,
    checkResourceOwner,
};
