import { API_BASE_URL } from '../config/api';

const getAdminHeaders = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('vizhabook_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const adminService = {
    // Admin Login
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Admin authentication failed.');
        }
        if (data.token) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
        }
        return data;
    },

    // Fetch Dashboard KPIs
    getDashboard: async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
            method: 'GET',
            headers: getAdminHeaders()
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch admin dashboard.');
        }
        return data;
    },

    // Fetch All Users List
    getUsers: async (search = '', plan = 'ALL', status = 'ALL') => {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        if (plan && plan !== 'ALL') query.append('plan', plan);
        if (status && status !== 'ALL') query.append('status', status);

        const response = await fetch(`${API_BASE_URL}/api/admin/users?${query.toString()}`, {
            method: 'GET',
            headers: getAdminHeaders()
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch users list.');
        }
        return data;
    },

    // Manually Update / Activate User Subscription
    updateUserSubscription: async (userId, payload) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/subscription`, {
            method: 'PATCH',
            headers: getAdminHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update subscription.');
        }
        return data;
    },

    // Fetch Deep-Dive User Analytics & Profile Details
    getUserAnalytics: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/analytics`, {
            method: 'GET',
            headers: getAdminHeaders()
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch user analytics.');
        }
        return data;
    },

    // Toggle User Account Status (SUSPENDED / ACTIVE)
    toggleUserStatus: async (userId, status) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
            method: 'PATCH',
            headers: getAdminHeaders(),
            body: JSON.stringify({ status })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update user status.');
        }
        return data;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    }
};
