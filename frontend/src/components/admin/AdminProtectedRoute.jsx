import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
    const adminToken = localStorage.getItem('adminToken');
    const adminUserRaw = localStorage.getItem('adminUser');
    
    let isSuperAdmin = false;
    if (adminToken && adminUserRaw) {
        try {
            const user = JSON.parse(adminUserRaw);
            if (user && user.role === 'SUPER_ADMIN') {
                isSuperAdmin = true;
            }
        } catch (e) {
            isSuperAdmin = false;
        }
    }

    if (!isSuperAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminProtectedRoute;
