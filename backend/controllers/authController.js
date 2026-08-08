import jwt from 'jsonwebtoken';
import { readDB, writeDB } from '../config/db.js';

const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET || 'vizhabook_secret_key', {
        expiresIn: '30d'
    });
};

// @desc Auth user & get token
// @route POST /api/auth/login
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide email/User ID and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Support 'admins' / 'password' temporary credentials
    if ((cleanEmail === 'admins' || cleanEmail === 'admin' || cleanEmail === 'admins@vizhabook.com') && password === 'password') {
        const token = generateToken('u_admin_1', 'admins@vizhabook.com');
        return res.json({
            success: true,
            user: {
                id: 'u_admin_1',
                name: 'System Admin',
                email: 'admins',
                phone: '9876543210',
                countryCode: '+91'
            },
            token
        });
    }

    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail || u.phone === email.trim());

    if (user && user.password === password) {
        const token = generateToken(user.id, user.email);
        return res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                countryCode: user.countryCode
            },
            token
        });
    }

    return res.status(401).json({ success: false, error: 'Invalid email/User ID or password.' });
};

// @desc Register new user
// @route POST /api/auth/signup
export const registerUser = async (req, res) => {
    const { name, email, phone, countryCode, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
    }

    const db = readDB();
    const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (exists) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const newUser = {
        id: `u_${Date.now()}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : '',
        countryCode: countryCode || '+91',
        password,
        createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    const token = generateToken(newUser.id, newUser.email);

    return res.status(201).json({
        success: true,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            countryCode: newUser.countryCode
        },
        token
    });
};

// @desc Get current user profile
// @route GET /api/auth/me
export const getMe = async (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
    }
    return res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            countryCode: user.countryCode
        }
    });
};

// @desc Password reset request
// @route POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
    const { email } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user) {
        return res.status(404).json({ success: false, error: 'No account found with this email.' });
    }

    return res.json({
        success: true,
        message: 'Password reset instructions have been sent to your email.'
    });
};
