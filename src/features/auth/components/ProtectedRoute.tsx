import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../stores/authStore';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated || !user) {
        // Not logged in, redirect to login page
        return <Navigate to="/auth" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Role not authorized, redirect to home or their appropriate dashboard
        console.warn(`Unauthorized access. Role ${user.role} tried to access a protected route.`);

        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'vendor') return <Navigate to="/vendor" replace />;
        return <Navigate to="/" replace />;
    }

    // Wrap in a layout or just return the sub-routes
    return <Outlet />;
}
