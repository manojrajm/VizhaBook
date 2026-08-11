import { readDB, writeDB, pool } from '../config/db.js';

// @desc Get all functions
// @route GET /api/functions
export const getFunctions = (req, res) => {
    const db = readDB();
    res.json({ success: true, functions: db.functions });
};

// @desc Create new function
// @route POST /api/functions
export const createFunction = async (req, res) => {
    const { title, type, date, venue, budget } = req.body;
    if (!title || !type || !date) {
        return res.status(400).json({ success: false, error: 'Title, type, and date are required.' });
    }

    // Check subscription limits if user is authenticated
    if (req.user && req.user.id) {
        try {
            const uRes = await pool.query("SELECT account_id FROM users WHERE id = $1 LIMIT 1;", [req.user.id]);
            const accountId = uRes.rows[0]?.account_id;
            if (accountId) {
                const subRes = await pool.query(
                    "SELECT * FROM subscriptions WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1;",
                    [accountId]
                );
                const sub = subRes.rows[0];
                const now = new Date();
                const endDate = sub ? new Date(sub.end_date) : new Date(0);
                const isExpired = sub ? ((sub.status === 'TRIAL' || sub.status === 'ACTIVE') && endDate < now) : false;

                if (isExpired) {
                    return res.status(403).json({
                        success: false,
                        limitReached: true,
                        isExpired: true,
                        error: 'Your trial or subscription has expired. Please choose a subscription plan to continue.'
                    });
                }

                let functionLimit = 1; // Default trial limit
                if (sub && sub.plan_id) {
                    const pRes = await pool.query("SELECT function_limit FROM subscription_plans WHERE id = $1 LIMIT 1;", [sub.plan_id]);
                    if (pRes.rows.length > 0) {
                        functionLimit = pRes.rows[0].function_limit;
                    }
                }

                if (functionLimit !== null) {
                    const db = readDB();
                    const existingCount = db.functions.filter(f => f.userId === req.user.id || !f.userId).length;
                    if (existingCount >= functionLimit) {
                        return res.status(403).json({
                            success: false,
                            limitReached: true,
                            functionLimit,
                            error: `Function limit reached (${functionLimit} max for your current plan). Please upgrade your plan to create more functions.`
                        });
                    }
                }
            }
        } catch (e) {
            console.warn("Function subscription check error:", e.message);
        }
    }

    const db = readDB();
    const newFunc = {
        id: `f_${Date.now()}`,
        userId: req.user?.id || 'u_demo_1',
        title: title.trim(),
        type,
        date,
        venue: venue || '',
        budget: Number(budget) || 0,
        status: 'Active',
        createdAt: new Date().toISOString()
    };

    db.functions.push(newFunc);
    writeDB(db);
    res.status(201).json({ success: true, function: newFunc });
};

// @desc Delete a function
// @route DELETE /api/functions/:id
export const deleteFunction = (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLen = db.functions.length;
    db.functions = db.functions.filter(f => f.id !== id);

    if (db.functions.length === initialLen) {
        return res.status(404).json({ success: false, error: 'Function not found.' });
    }

    writeDB(db);
    res.json({ success: true, message: 'Function deleted successfully.' });
};
