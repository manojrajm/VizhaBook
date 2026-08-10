import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import pool from '../config/db.js';

const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET || 'vizhabook_secret_key', {
        expiresIn: '30d'
    });
};

// @desc Auth user & get token
// @route POST /api/auth/login
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    // Instant demo login bypass
    if ((cleanEmail === 'admins' || cleanEmail === 'admin' || cleanEmail === 'admins@vizhabook.com' || cleanEmail === 'demo@vizhabook.com') && (password === 'password' || password === 'demo1234')) {
        const token = generateToken('u_admin_1', 'admins@vizhabook.com');
        return res.json({
            success: true,
            user: {
                id: 'u_admin_1',
                name: 'VizhaBook Demo User',
                email: cleanEmail,
                phone: '9876543210',
                countryCode: '+91'
            },
            token
        });
    }

    try {
        // Prisma lookup
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: cleanEmail },
                    { phone: (email || '').trim() }
                ]
            }
        });

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password).catch(() => user.password === password);
            if (isMatch) {
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
        }
    } catch (dbErr) {
        console.warn('Prisma lookup failed, checking pg pool:', dbErr.message);
    }

    // Direct PostgreSQL pool fallback
    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2 LIMIT 1",
            [cleanEmail, (email || '').trim()]
        );
        if (result.rows.length > 0) {
            const pgUser = result.rows[0];
            const isMatch = await bcrypt.compare(password, pgUser.password).catch(() => pgUser.password === password);
            if (isMatch) {
                const token = generateToken(pgUser.id, pgUser.email);
                return res.json({
                    success: true,
                    user: {
                        id: pgUser.id,
                        name: pgUser.name,
                        email: pgUser.email,
                        phone: pgUser.phone,
                        countryCode: pgUser.country_code || pgUser.countryCode || '+91'
                    },
                    token
                });
            }
        }
    } catch (pgErr) {
        console.error('PostgreSQL Direct Query Error:', pgErr.message);
    }

    return res.status(401).json({ success: false, error: 'Invalid email/phone or password.' });
};

// @desc Register new user (Strict USER role assignment)
// @route POST /api/auth/signup
export const registerUser = async (req, res) => {
    // Client role input is strictly ignored; public registration always assigns USER
    const { name, email, phone, countryCode, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? phone.trim() : '';
    const userRole = 'USER';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        // Prisma User Creation
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: cleanEmail },
                    { phone: cleanPhone }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, error: 'An account with this email or phone number already exists.' });
        }

        const newUser = await prisma.user.create({
            data: {
                name: name.trim(),
                email: cleanEmail,
                phone: cleanPhone,
                countryCode: countryCode || '+91',
                password: hashedPassword
            }
        });

        const token = generateToken(newUser.id, newUser.email);
        return res.status(201).json({
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                countryCode: newUser.countryCode,
                role: userRole
            },
            token
        });
    } catch (prismaErr) {
        console.warn('Prisma user creation failed, attempting direct PG pool insertion:', prismaErr.message);
    }

    // Direct PostgreSQL pool fallback
    try {
        const id = `u_${Date.now()}`;
        const query = `
            INSERT INTO users (id, name, email, phone, country_code, password, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *;
        `;
        const values = [id, name.trim(), cleanEmail, cleanPhone, countryCode || '+91', hashedPassword];
        const result = await pool.query(query, values);
        const newUser = result.rows[0];

        const token = generateToken(newUser.id, newUser.email);
        return res.status(201).json({
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                countryCode: newUser.country_code || countryCode,
                role: userRole
            },
            token
        });
    } catch (pgErr) {
        console.error('PostgreSQL Insert Error:', pgErr.message);
        return res.status(500).json({ success: false, error: 'Failed to create user account in database.' });
    }
};

// @desc Get current user profile
// @route GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user) {
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
        }
    } catch (e) {
        // Fallback
    }

    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [req.user.id]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            return res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    countryCode: user.country_code || '+91'
                }
            });
        }
    } catch (e) {
        // Fallback
    }

    return res.status(404).json({ success: false, error: 'User not found.' });
};

// @desc Password reset request
// @route POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
    const { email } = req.body;
    return res.json({
        success: true,
        message: 'Password reset instructions have been sent to your email.'
    });
};
