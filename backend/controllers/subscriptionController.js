import pool from '../config/db.js';

// Helper: Ensure user has account_id
const getUserAccountId = async (userId, userEmail) => {
    let res = await pool.query("SELECT account_id, id, name FROM users WHERE id = $1 LIMIT 1;", [userId]);
    if (!res.rows.length && userEmail) {
        res = await pool.query("SELECT account_id, id, name FROM users WHERE LOWER(email) = $1 LIMIT 1;", [userEmail.toLowerCase()]);
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
    return null;
};

// @desc Get active subscription plans
// @route GET /api/subscription-plans
export const getSubscriptionPlans = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM subscription_plans WHERE status = 'ACTIVE' ORDER BY price ASC;"
        );
        return res.json({
            success: true,
            plans: result.rows
        });
    } catch (e) {
        console.error("getSubscriptionPlans Error:", e.message);
        return res.status(500).json({ success: false, error: "Failed to fetch subscription plans." });
    }
};

// @desc Get current account subscription & trial state
// @route GET /api/subscriptions/current
export const getCurrentSubscription = async (req, res) => {
    try {
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: "Account not found." });
        }

        let subRes = await pool.query(
            "SELECT * FROM subscriptions WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1;",
            [accountId]
        );

        let sub = subRes.rows[0];

        // Auto-provision 14-day Free Trial if account has no subscription entry
        if (!sub) {
            const newSubId = `sub_${Date.now()}`;
            const createSubQuery = `
                INSERT INTO subscriptions (id, account_id, plan_id, status, start_date, end_date, created_at, updated_at)
                VALUES ($1, $2, 'PLAN_BASIC', 'TRIAL', NOW(), NOW() + INTERVAL '14 days', NOW(), NOW())
                RETURNING *;
            `;
            const createRes = await pool.query(createSubQuery, [newSubId, accountId]);
            sub = createRes.rows[0];
        }

        // Determine dynamic status based on end_date
        const now = new Date();
        const endDate = new Date(sub.end_date);
        let currentStatus = sub.status;

        if ((sub.status === 'TRIAL' || sub.status === 'ACTIVE') && endDate < now) {
            currentStatus = 'EXPIRED';
        }

        const msDiff = endDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

        // Fetch plan details if associated
        let plan = null;
        if (sub.plan_id) {
            const planRes = await pool.query(
                "SELECT * FROM subscription_plans WHERE id = $1 LIMIT 1;",
                [sub.plan_id]
            );
            plan = planRes.rows[0] || null;
        }

        return res.json({
            success: true,
            subscription: {
                ...sub,
                status: currentStatus
            },
            plan,
            status: currentStatus,
            isTrial: currentStatus === 'TRIAL',
            isActive: currentStatus === 'ACTIVE',
            isExpired: currentStatus === 'EXPIRED',
            daysRemaining
        });
    } catch (e) {
        console.error("getCurrentSubscription Error:", e.message);
        return res.status(500).json({ success: false, error: "Failed to fetch current subscription." });
    }
};

// @desc Get usage metrics and limit booleans
// @route GET /api/subscriptions/usage
export const getUsage = async (req, res) => {
    try {
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: "Account not found." });
        }

        // Get subscription
        const subRes = await pool.query(
            "SELECT * FROM subscriptions WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1;",
            [accountId]
        );
        const sub = subRes.rows[0];

        const now = new Date();
        const endDate = sub ? new Date(sub.end_date) : new Date(0);
        let currentStatus = sub ? sub.status : 'EXPIRED';
        if (sub && (sub.status === 'TRIAL' || sub.status === 'ACTIVE') && endDate < now) {
            currentStatus = 'EXPIRED';
        }

        let functionLimit = 1; // Trial default: 1 function
        let entryLimit = 300;  // Trial default: 300 entries

        if (sub && sub.plan_id) {
            const planRes = await pool.query("SELECT * FROM subscription_plans WHERE id = $1 LIMIT 1;", [sub.plan_id]);
            if (planRes.rows.length > 0) {
                const p = planRes.rows[0];
                functionLimit = p.function_limit; // null means unlimited
                entryLimit = p.entry_limit;
            }
        }

        // Count functions for account
        const funcCountRes = await pool.query(
            "SELECT COUNT(*)::int AS count FROM functions WHERE account_id = $1;",
            [accountId]
        );
        const functionsUsed = funcCountRes.rows[0].count || 0;

        // Count moi entries across all functions owned by account
        const entryCountRes = await pool.query(
            "SELECT COUNT(*)::int AS count FROM moi_entries m JOIN functions f ON m.function_id = f.id WHERE f.account_id = $1;",
            [accountId]
        );
        const entriesUsed = entryCountRes.rows[0].count || 0;

        const isExpired = currentStatus === 'EXPIRED';
        const canCreateFunction = !isExpired && (functionLimit === null || functionsUsed < functionLimit);
        const canCreateEntry = !isExpired && (entryLimit === null || entriesUsed < entryLimit);

        return res.json({
            success: true,
            status: currentStatus,
            isExpired,
            functionsUsed,
            functionLimit,
            entriesUsed,
            entryLimit,
            canCreateFunction,
            canCreateEntry
        });
    } catch (e) {
        console.error("getUsage Error:", e.message);
        return res.status(500).json({ success: false, error: "Failed to fetch usage metrics." });
    }
};

// @desc Select and activate a plan (Simulated payment activation)
// @route POST /api/subscriptions/select-plan
export const selectPlan = async (req, res) => {
    try {
        const { planId } = req.body;
        if (!planId) {
            return res.status(400).json({ success: false, error: "Plan ID is required." });
        }

        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: "Account not found." });
        }

        // Fetch selected plan
        const planRes = await pool.query("SELECT * FROM subscription_plans WHERE id = $1 LIMIT 1;", [planId]);
        if (!planRes.rows.length) {
            return res.status(404).json({ success: false, error: "Selected plan not found." });
        }
        const plan = planRes.rows[0];

        // Create or update active subscription
        const subId = `sub_${Date.now()}`;
        const upsertQuery = `
            INSERT INTO subscriptions (id, account_id, plan_id, status, start_date, end_date, created_at)
            VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW() + INTERVAL '1 year', NOW())
            RETURNING *;
        `;
        const subResult = await pool.query(upsertQuery, [subId, accountId, plan.id]);
        const subscription = subResult.rows[0];

        // Create payment record
        const paymentId = `pay_${Date.now()}`;
        await pool.query(
            "INSERT INTO payments (id, account_id, subscription_id, amount, currency, status, payment_date, created_at, updated_at) VALUES ($1, $2, $3, $4, 'INR', 'SUCCESS', NOW(), NOW(), NOW());",
            [paymentId, accountId, subscription.id, plan.price]
        );

        return res.json({
            success: true,
            message: "Subscription activated successfully!",
            subscription,
            plan
        });
    } catch (e) {
        console.error("selectPlan Error:", e.message);
        return res.status(500).json({ success: false, error: "Failed to activate subscription plan." });
    }
};

// @desc Cancel subscription
// @route POST /api/subscriptions/cancel
export const cancelSubscription = async (req, res) => {
    try {
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: "Account not found." });
        }

        await pool.query(
            "UPDATE subscriptions SET status = 'CANCELLED' WHERE account_id = $1;",
            [accountId]
        );

        return res.json({
            success: true,
            message: "Subscription cancelled successfully."
        });
    } catch (e) {
        console.error("cancelSubscription Error:", e.message);
        return res.status(500).json({ success: false, error: "Failed to cancel subscription." });
    }
};
