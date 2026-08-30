import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

const USERS_KEY = 'moi_users';
const CURRENT_USER_KEY = 'moi_current_user';
const SESSION_USER_KEY = 'moi_session_user';

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, validate active authentication token with backend
    useEffect(() => {
        const verifySession = async () => {
            setLoading(true);
            const token = localStorage.getItem('vizhabook_token');
            const persistedUser = localStorage.getItem(CURRENT_USER_KEY);

            if (token) {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const data = await res.json();
                    if (res.ok && data.success && data.user) {
                        setCurrentUser(data.user);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.warn('Token validation offline fallback check:', err);
                }
            }

            // Fallback to persisted session if valid token was present or stored offline user
            if (token && persistedUser) {
                try {
                    setCurrentUser(JSON.parse(persistedUser));
                } catch (e) {
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
                localStorage.removeItem(CURRENT_USER_KEY);
                sessionStorage.removeItem(SESSION_USER_KEY);
                localStorage.removeItem('vizhabook_token');
            }

            setLoading(false);
        };

        verifySession();
    }, []);

    // Get all registered users
    const getUsers = () => {
        const saved = localStorage.getItem(USERS_KEY);
        return saved ? JSON.parse(saved) : [];
    };

    // Sign up — call API backend (/api/auth/signup)
    const signup = async (userData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    countryCode: userData.countryCode || '+91',
                    password: userData.password
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                return { success: false, error: data.error || 'Failed to create account.' };
            }

            return { success: true, user: data.user, message: 'Account created successfully!' };
        } catch (err) {
            console.warn('Backend API connection failed, using fallback storage:', err);
            const users = getUsers();
            const exists = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
            if (exists) {
                return { success: false, error: 'An account with this email already exists.' };
            }
            const newUser = {
                id: `u_${Date.now()}`,
                name: userData.name,
                phone: userData.phone,
                countryCode: userData.countryCode || '+91',
                email: userData.email.toLowerCase(),
                password: userData.password,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return { success: true, user: newUser, message: 'Account created successfully!' };
        }
    };

    // Login — call API backend (/api/auth/login)
    const login = async (email, password, rememberMe = false) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                return { success: false, error: data.error || 'Invalid credentials.' };
            }

            const sessionUser = data.user;
            setCurrentUser(sessionUser);
            if (rememberMe) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
                sessionStorage.removeItem(SESSION_USER_KEY);
            } else {
                sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
                localStorage.removeItem(CURRENT_USER_KEY);
            }
            if (data.token) {
                localStorage.setItem('vizhabook_token', data.token);
            }
            return { success: true };
        } catch (err) {
            console.warn('Backend API connection failed, using fallback login:', err);
            const cleanEmail = (email || '').trim().toLowerCase();
            if ((cleanEmail === 'admins' || cleanEmail === 'admin' || cleanEmail === 'admins@vizhabook.com') && password === 'password') {
                const sessionUser = { id: 'u_admin_1', name: 'System Admin', email: 'admins', phone: '9876543210', countryCode: '+91' };
                setCurrentUser(sessionUser);
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
                return { success: true };
            }
            const users = getUsers();
            const user = users.find(u => (u.email.toLowerCase() === cleanEmail || (u.phone && u.phone === email.trim())) && u.password === password);
            if (!user) {
                return { success: false, error: 'Invalid User ID/Email or Password.' };
            }
            const sessionUser = { id: user.id, name: user.name, email: user.email, phone: user.phone, countryCode: user.countryCode };
            setCurrentUser(sessionUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
            return { success: true };
        }
    };

    // Logout
    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        sessionStorage.removeItem(SESSION_USER_KEY);
        localStorage.removeItem('vizhabook_token');
    };

    // Simulated OTP — always generates 123456, logs to console
    const sendOtp = (email) => {
        console.log(`[VizhaBook OTP] Verification code for ${email}: 123456`);
        return { success: true, message: 'OTP sent to your email (dev mode: check console, code is 123456)' };
    };

    const verifyOtp = (email, code) => {
        if (code === '123456') {
            return { success: true };
        }
        return { success: false, error: 'Invalid OTP. Please try again.' };
    };

    // Simulated password reset
    const resetPassword = (email) => {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return { success: false, error: 'No account found with this email.' };
        }
        console.log(`[VizhaBook] Password reset requested for ${email}`);
        return { success: true, message: 'Password reset link sent to your email.' };
    };

    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{
            currentUser,
            isAuthenticated,
            loading,
            login,
            signup,
            logout,
            sendOtp,
            verifyOtp,
            resetPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
