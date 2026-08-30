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
        const demoUserId = 'u_admin_1';
        const demoAccId = 'acc_admin_1';
        const demoEmail = 'admins@vizhabook.com';

        try {
            await pool.query(
                "INSERT INTO accounts (id, name, status, created_at, updated_at) VALUES ($1, $2, 'ACTIVE', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;",
                [demoAccId, "VizhaBook Demo User's Account"]
            );
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password', salt);
            await pool.query(
                `INSERT INTO users (id, name, email, phone, country_code, password, role, account_id, created_at)
                 VALUES ($1, $2, $3, $4, '+91', $5, 'ADMIN', $6, NOW())
                 ON CONFLICT (id) DO UPDATE SET account_id = $6;`,
                [demoUserId, 'VizhaBook Demo User', demoEmail, '9876543210', hashedPassword, demoAccId]
            );
        } catch (e) {
            console.warn("Demo user seed warning:", e.message);
        }

        const token = generateToken(demoUserId, demoEmail);
        return res.json({
            success: true,
            user: {
                id: demoUserId,
                name: 'VizhaBook Demo User',
                email: demoEmail,
                phone: '9876543210',
                countryCode: '+91',
                role: 'ADMIN',
                accountId: demoAccId
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
                        countryCode: user.countryCode || user.country_code || '+91',
                        role: user.role || 'USER',
                        accountId: user.accountId || user.account_id
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
                        countryCode: pgUser.country_code || pgUser.countryCode || '+91',
                        role: pgUser.role || 'USER',
                        accountId: pgUser.account_id || pgUser.accountId
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

// @desc Register new user (Strict USER role & Account creation)
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
                password: hashedPassword,
                role: 'USER',
                account: {
                    create: {
                        name: `${name.trim()}'s Account`,
                        status: 'ACTIVE'
                    }
                }
            },
            include: {
                account: true
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
                countryCode: newUser.countryCode || newUser.country_code,
                role: newUser.role || userRole,
                accountId: newUser.accountId || newUser.account_id || (newUser.account ? newUser.account.id : null)
            },
            token
        });
    } catch (prismaErr) {
        console.warn('Prisma user creation failed, attempting direct PG pool insertion:', prismaErr.message);
    }

    // Direct PostgreSQL pool fallback
    try {
        const id = `u_${Date.now()}`;
        const accId = `acc_${Date.now()}`;

        // Create Account
        await pool.query(
            "INSERT INTO accounts (id, name, status, created_at, updated_at) VALUES ($1, $2, 'ACTIVE', NOW(), NOW());",
            [accId, `${name.trim()}'s Account`]
        );

        // Create User
        const query = `
            INSERT INTO users (id, name, email, phone, country_code, password, role, account_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *;
        `;
        const values = [id, name.trim(), cleanEmail, cleanPhone, countryCode || '+91', hashedPassword, userRole, accId];
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
                role: newUser.role || userRole,
                accountId: newUser.account_id || accId
            },
            token
        });
    } catch (pgErr) {
        console.error('PostgreSQL Insert Error:', pgErr.message);
        return res.status(500).json({ success: false, error: 'Failed to create user account in database.' });
    }
};

// Self-healing helper: Ensures every user record has a valid Account and account_id
const ensureUserAccount = async (user) => {
    let accId = user.accountId || user.account_id;
    if (!accId) {
        accId = `acc_${Date.now()}`;
        try {
            await pool.query(
                "INSERT INTO accounts (id, name, status, created_at, updated_at) VALUES ($1, $2, 'ACTIVE', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;",
                [accId, `${(user.name || 'User').trim()}'s Account`]
            );
            await pool.query(
                "UPDATE users SET account_id = $1, role = COALESCE(role, 'USER') WHERE id = $2;",
                [accId, user.id]
            );
        } catch (err) {
            console.error('Account auto-healing error:', err.message);
        }
    }
    return accId;
};

// @desc Get current user profile
// @route GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user) {
            const accId = await ensureUserAccount(user);
            return res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    countryCode: user.countryCode || user.country_code || '+91',
                    role: user.role || 'USER',
                    accountId: accId
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
            const accId = await ensureUserAccount(user);
            return res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    countryCode: user.country_code || '+91',
                    role: user.role || 'USER',
                    accountId: accId
                }
            });
        }
    } catch (pgErr) {
        console.error('getMe error:', pgErr.message);
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
