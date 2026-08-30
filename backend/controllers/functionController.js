import pool from '../config/db.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Resolve account_id from authenticated JWT user (never trust client)
// ─────────────────────────────────────────────────────────────────────────────
const getAccountId = async (userId, userEmail) => {
    let res = await pool.query(
        'SELECT account_id, id, name FROM users WHERE id = $1 LIMIT 1;',
        [userId]
    );
    if (!res.rows.length && userEmail) {
        res = await pool.query(
            'SELECT account_id, id, name FROM users WHERE LOWER(email) = $1 LIMIT 1;',
            [userEmail.toLowerCase()]
        );
    }
    if (res.rows.length > 0) {
        let accId = res.rows[0].account_id;
        if (!accId) {
            accId = `acc_${Date.now()}`;
            await pool.query(
                "INSERT INTO accounts (id, name, status, created_at, updated_at) VALUES ($1, $2, 'ACTIVE', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;",
                [accId, `${(res.rows[0].name || 'User').trim()}'s Account`]
            );
            await pool.query("UPDATE users SET account_id = $1 WHERE id = $2;", [accId, res.rows[0].id]);
        }
        return accId;
    }
    if (userId || userEmail) {
        const fallbackAccId = `acc_${userId || Date.now()}`;
        const fallbackUserId = userId || `u_${Date.now()}`;
        const email = userEmail || `${fallbackUserId}@vizhabook.com`;
        try {
            await pool.query(
                "INSERT INTO accounts (id, name, status, created_at, updated_at) VALUES ($1, $2, 'ACTIVE', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;",
                [fallbackAccId, "User's Account"]
            );
            await pool.query(
                `INSERT INTO users (id, name, email, phone, password, role, account_id, created_at)
                 VALUES ($1, 'User', $2, '', '', 'USER', $3, NOW())
                 ON CONFLICT (id) DO UPDATE SET account_id = $3;`,
                [fallbackUserId, email, fallbackAccId]
            );
            return fallbackAccId;
        } catch (e) {
            console.error("Auto-provision account error:", e.message);
        }
    }
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Check subscription limit before creating a function
// Returns { allowed: true } or { allowed: false, limitReached, isExpired, functionLimit, error }
// ─────────────────────────────────────────────────────────────────────────────
const checkFunctionLimit = async (accountId) => {
    try {
        const subRes = await pool.query(
            `SELECT s.*, sp.function_limit
             FROM subscriptions s
             LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
             WHERE s.account_id = $1
             ORDER BY s.created_at DESC
             LIMIT 1;`,
            [accountId]
        );

        const sub = subRes.rows[0];
        const now = new Date();

        if (sub) {
            const endDate = new Date(sub.end_date);
            const isExpiredSub =
                (sub.status === 'TRIAL' || sub.status === 'ACTIVE') && endDate < now;

            if (isExpiredSub || sub.status === 'EXPIRED' || sub.status === 'CANCELLED') {
                return {
                    allowed: false,
                    isExpired: true,
                    error: 'Your trial or subscription has expired. Please choose a subscription plan to continue.'
                };
            }
        }

        // function_limit = null means unlimited (Premium plan)
        const functionLimit = sub?.function_limit ?? 1; // Default trial limit = 1

        if (functionLimit !== null) {
            const countRes = await pool.query(
                `SELECT COUNT(*) AS cnt FROM functions
                 WHERE account_id = $1 AND status != 'ARCHIVED';`,
                [accountId]
            );
            const currentCount = parseInt(countRes.rows[0].cnt, 10);

            if (currentCount >= functionLimit) {
                return {
                    allowed: false,
                    limitReached: true,
                    functionLimit,
                    error: `Function limit reached (${functionLimit} max for your current plan). Please upgrade your plan to create more functions.`
                };
            }
        }

        return { allowed: true };
    } catch (e) {
        console.error('checkFunctionLimit error:', e.message);
        return { allowed: true }; // Fail-open to avoid blocking users on infra errors
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get all functions for authenticated account
// @route GET /api/functions
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getFunctions = async (req, res) => {
    try {
        const accountId = await getAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const result = await pool.query(
            `SELECT
                f.*,
                COUNT(m.id) AS moi_entry_count,
                COALESCE(SUM(m.amount), 0) AS total_moi_amount
             FROM functions f
             LEFT JOIN moi_entries m ON m.function_id = f.id
             WHERE f.account_id = $1
             GROUP BY f.id
             ORDER BY f.event_date DESC;`,
            [accountId]
        );

        return res.json({ success: true, functions: result.rows });
    } catch (e) {
        console.error('getFunctions error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch functions.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get single function by ID (account-scoped)
// @route GET /api/functions/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getFunctionById = async (req, res) => {
    try {
        const accountId = await getAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const { id } = req.params;

        const funcRes = await pool.query(
            `SELECT
                f.*,
                COUNT(DISTINCT m.id) AS moi_entry_count,
                COALESCE(SUM(m.amount), 0) AS total_moi_amount,
                COUNT(DISTINCT e.id) AS expense_count,
                COALESCE(SUM(e.amount), 0) AS total_expenses
             FROM functions f
             LEFT JOIN moi_entries m ON m.function_id = f.id
             LEFT JOIN expenses e ON e.function_id = f.id
             WHERE f.id = $1 AND f.account_id = $2
             GROUP BY f.id;`,
            [id, accountId]
        );

        if (!funcRes.rows.length) {
            return res.status(404).json({ success: false, error: 'Function not found or access denied.' });
        }

        // Fetch recent moi entries for this function
        const moiRes = await pool.query(
            `SELECT * FROM moi_entries
             WHERE function_id = $1
             ORDER BY created_at DESC
             LIMIT 10;`,
            [id]
        );

        return res.json({
            success: true,
            function: funcRes.rows[0],
            recentMoiEntries: moiRes.rows
        });
    } catch (e) {
        console.error('getFunctionById error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch function details.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Create a new function
// @route POST /api/functions
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const createFunction = async (req, res) => {
    try {
        const accountId = await getAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        // Enforce subscription limit (server-side — cannot be bypassed)
        const limitCheck = await checkFunctionLimit(accountId);
        if (!limitCheck.allowed) {
            return res.status(403).json({ success: false, ...limitCheck });
        }

        const { name, event_date, location, description, status } = req.body;

        // Basic presence validation (Zod handles shape on frontend)
        if (!name || !name.trim() || name.trim().length < 2) {
            return res.status(400).json({ success: false, error: 'Function name must be at least 2 characters.' });
        }
        if (!event_date) {
            return res.status(400).json({ success: false, error: 'Event date is required.' });
        }

        const id = `fn_${Date.now()}`;
        const validStatuses = ['ACTIVE', 'COMPLETED', 'ARCHIVED'];
        const finalStatus = validStatuses.includes(status) ? status : 'ACTIVE';

        const result = await pool.query(
            `INSERT INTO functions (id, account_id, name, event_date, location, description, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING *;`,
            [id, accountId, name.trim(), event_date, location?.trim() || null, description?.trim() || null, finalStatus]
        );

        return res.status(201).json({ success: true, function: result.rows[0] });
    } catch (e) {
        console.error('createFunction error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to create function.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update a function (name, event_date, location, description, status)
// @route PUT /api/functions/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const updateFunction = async (req, res) => {
    try {
        const accountId = await getAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const { id } = req.params;

        // Verify ownership BEFORE update
        const existing = await pool.query(
            'SELECT id FROM functions WHERE id = $1 AND account_id = $2;',
            [id, accountId]
        );
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Function not found or access denied.' });
        }

        const { name, event_date, location, description, status } = req.body;

        if (!name || !name.trim() || name.trim().length < 2) {
            return res.status(400).json({ success: false, error: 'Function name must be at least 2 characters.' });
        }
        if (!event_date) {
            return res.status(400).json({ success: false, error: 'Event date is required.' });
        }

        const validStatuses = ['ACTIVE', 'COMPLETED', 'ARCHIVED'];
        const finalStatus = validStatuses.includes(status) ? status : 'ACTIVE';

        const result = await pool.query(
            `UPDATE functions
             SET name = $1, event_date = $2, location = $3, description = $4, status = $5, updated_at = NOW()
             WHERE id = $6 AND account_id = $7
             RETURNING *;`,
            [name.trim(), event_date, location?.trim() || null, description?.trim() || null, finalStatus, id, accountId]
        );

        return res.json({ success: true, function: result.rows[0] });
    } catch (e) {
        console.error('updateFunction error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to update function.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Delete a function (account-scoped — cannot delete another account's data)
// @route DELETE /api/functions/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const deleteFunction = async (req, res) => {
    try {
        const accountId = await getAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const { id } = req.params;

        // Verify ownership before deletion
        const existing = await pool.query(
            'SELECT id FROM functions WHERE id = $1 AND account_id = $2;',
            [id, accountId]
        );
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Function not found or access denied.' });
        }

        // Delete (moi_entries cascade is handled by DB FK or delete explicitly)
        await pool.query(
            'DELETE FROM functions WHERE id = $1 AND account_id = $2;',
            [id, accountId]
        );

        return res.json({ success: true, message: 'Function deleted successfully.' });
    } catch (e) {
        console.error('deleteFunction error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to delete function.' });
    }
};
