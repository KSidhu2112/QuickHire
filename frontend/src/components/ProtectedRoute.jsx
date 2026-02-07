import React from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const isLoggedIn = authAPI.isLoggedIn();
    const user = authAPI.getStoredUser();

    // Not logged in - redirect to login
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // Check role if specified
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
