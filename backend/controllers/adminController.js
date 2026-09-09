import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper: Ensure user has account_id
const getUserAccountId = async (userId) => {
    const res = await pool.query("SELECT account_id, id, name FROM users WHERE id = $1 LIMIT 1;", [userId]);
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

// @desc Admin Login
// @route POST /api/admin/login
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userResult = await pool.query(
            "SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1;",
            [email.toLowerCase().trim()]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, error: "Invalid admin credentials." });
        }

        const user = userResult.rows[0];

        // Verify Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Invalid admin credentials." });
        }

        // Verify Super Admin Role
        if (user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                error: "Access denied. Only Super Admin accounts can access the Admin Portal."
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role },
            process.env.JWT_SECRET || 'vizhabook_secret_key',
            { expiresIn: '7d' }
        );

        return res.json({
            success: true,
            message: "Super Admin authentication successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("adminLogin Error:", error);
        return res.status(500).json({ success: false, error: "Server error during admin login." });
    }
};

// @desc Get Executive Dashboard Pro Analytics Data
// @route GET /api/admin/dashboard
export const getAdminDashboard = async (req, res) => {
    try {
        // 1. Total Registered Users & Users Added This Month
        const usersRes = await pool.query(`
            SELECT 
                COUNT(*)::int AS total_users,
                COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END)::int AS users_this_month
            FROM users;
        `);
        const totalUsers = usersRes.rows[0]?.total_users || 0;
        const usersThisMonth = usersRes.rows[0]?.users_this_month || 0;

        // 2. Total Functions Created Across All Users
        const functionsRes = await pool.query(`SELECT COUNT(*)::int AS total_functions FROM functions;`);
        const totalFunctions = functionsRes.rows[0]?.total_functions || 0;

        // 3. Total Moi Amount Processed Across All Events
        const moiRes = await pool.query(`SELECT COALESCE(SUM(amount), 0)::numeric AS total_moi FROM moi_entries;`);
        const totalMoiAmount = parseFloat(moiRes.rows[0]?.total_moi || 0);

        // 4. Monthly SaaS Revenue (Last 30 days payments sum)
        const revRes = await pool.query(`
            SELECT COALESCE(SUM(amount), 0)::numeric AS monthly_revenue 
            FROM payments 
            WHERE created_at >= NOW() - INTERVAL '30 days' OR payment_date >= NOW() - INTERVAL '30 days';
        `);
        const monthlyRevenue = parseFloat(revRes.rows[0]?.monthly_revenue || 0);

        // 5. Average Moi Amount Per Event
        const avgMoiPerEvent = totalFunctions > 0 ? Math.round(totalMoiAmount / totalFunctions) : 0;

        // 6. Subscription Statistics (Distribution per Plan)
        const subStatsRes = await pool.query(`
            SELECT 
                COALESCE(p.name, 'Free Plan') AS plan_name,
                COALESCE(p.id, 'PLAN_FREE') AS plan_id,
                COUNT(s.id)::int AS active_users
            FROM users u
            LEFT JOIN subscriptions s ON u.account_id = s.account_id
            LEFT JOIN subscription_plans p ON s.plan_id = p.id
            GROUP BY p.name, p.id
            ORDER BY active_users DESC;
        `);

        // Get all standard plans for structured distribution response
        const allPlansRes = await pool.query(`SELECT id, name FROM subscription_plans ORDER BY price ASC;`);
        const planCountsMap = {};
        subStatsRes.rows.forEach(r => {
            planCountsMap[r.plan_name] = r.active_users;
        });

        // Ensure default plans are present if DB has custom rows
        const planDistribution = [
            { plan: 'Free Plan', id: 'PLAN_FREE', count: planCountsMap['Free Plan'] || planCountsMap['FREE'] || 0 },
            { plan: 'Basic Plan', id: 'PLAN_BASIC', count: planCountsMap['Basic Plan'] || planCountsMap['BASIC'] || 0 },
            { plan: 'Standard Plan', id: 'PLAN_STANDARD', count: planCountsMap['Standard Plan'] || planCountsMap['STANDARD'] || 0 },
            { plan: 'Pro Plan', id: 'PLAN_PRO', count: planCountsMap['Pro Celebration Plan'] || planCountsMap['Pro Plan'] || 0 },
            { plan: 'Premium Plan', id: 'PLAN_PREMIUM', count: planCountsMap['Premium Plan'] || planCountsMap['PREMIUM'] || 0 },
            { plan: 'Grand Enterprise', id: 'PLAN_ENTERPRISE', count: planCountsMap['Grand Enterprise Plan'] || 0 }
        ];

        // Also merge any DB plans from subscription_plans table
        allPlansRes.rows.forEach(plan => {
            const existing = planDistribution.find(p => p.id === plan.id || p.plan.toLowerCase() === plan.name.toLowerCase());
            if (!existing) {
                planDistribution.push({
                    plan: plan.name,
                    id: plan.id,
                    count: planCountsMap[plan.name] || 0
                });
            } else {
                existing.plan = plan.name;
                existing.id = plan.id;
            }
        });

        // Calculate Percentages & Identify Most Popular Plan
        const totalSubscribedUsers = planDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
        let mostPopularPlan = { name: 'Free Plan', count: 0 };

        planDistribution.forEach(item => {
            item.percentage = parseFloat(((item.count / totalSubscribedUsers) * 100).toFixed(1));
            if (item.count >= mostPopularPlan.count) {
                mostPopularPlan = { name: item.plan, count: item.count };
            }
        });

        // 7. Interactive Monthly Trends Query (Last 6 Months)
        const trendsRes = await pool.query(`
            SELECT 
                to_char(series_month, 'Mon') AS month,
                series_month AS month_date,
                COALESCE((
                    SELECT SUM(amount)::numeric 
                    FROM moi_entries 
                    WHERE date_trunc('month', created_at) = series_month
                ), 0) AS moi_amount,
                COALESCE((
                    SELECT SUM(amount)::numeric 
                    FROM payments 
                    WHERE date_trunc('month', created_at) = series_month OR date_trunc('month', payment_date) = series_month
                ), 0) AS revenue_amount
            FROM generate_series(
                date_trunc('month', NOW() - INTERVAL '5 months'),
                date_trunc('month', NOW()),
                '1 month'::interval
            ) AS series_month
            ORDER BY series_month ASC;
        `);

        const monthlyTrends = trendsRes.rows.map(row => ({
            month: row.month,
            moiAmount: parseFloat(row.moi_amount || 0),
            revenueAmount: parseFloat(row.revenue_amount || 0)
        }));

        // 8. Event Type Breakdown Query
        const eventBreakdownRes = await pool.query(`
            SELECT 
                CASE 
                    WHEN LOWER(name) LIKE '%wedding%' OR LOWER(name) LIKE '%திருமணம்%' THEN 'Wedding (திருமணம்)'
                    WHEN LOWER(name) LIKE '%engag%' OR LOWER(name) LIKE '%நிச்சய%' THEN 'Engagement (நிச்சயதார்த்தம்)'
                    WHEN LOWER(name) LIKE '%recep%' OR LOWER(name) LIKE '%வரவேற்பு%' THEN 'Reception (வரவேற்பு)'
                    WHEN LOWER(name) LIKE '%house%' OR LOWER(name) LIKE '%கிரகப்%' THEN 'Housewarming (கிரகப்பிரவேசம்)'
                    WHEN LOWER(name) LIKE '%ear%' OR LOWER(name) LIKE '%காது%' THEN 'Ear Piercing (காதுகுத்து)'
                    ELSE 'Other Celebrations'
                END AS category,
                COUNT(*)::int AS count
            FROM functions
            GROUP BY category
            ORDER BY count DESC;
        `);

        const eventTypeDistribution = eventBreakdownRes.rows.map(r => ({
            category: r.category,
            count: r.count
        }));

        // 9. Top Regional / District Moi Hubs
        const districtRes = await pool.query(`
            SELECT 
                COALESCE(NULLIF(TRIM(village_city), ''), 'Madurai / Chennai') AS city,
                COALESCE(SUM(amount), 0)::numeric AS total_amount,
                COUNT(*)::int AS count
            FROM moi_entries
            GROUP BY city
            ORDER BY total_amount DESC
            LIMIT 5;
        `);

        const topDistricts = districtRes.rows.map(r => ({
            city: r.city,
            totalAmount: parseFloat(r.total_amount || 0),
            count: r.count
        }));

        // 10. Recent Real-Time Transactions Stream
        const recentTxRes = await pool.query(`
            SELECT 
                m.id,
                COALESCE(m.guest_name, m.name) AS guest_name,
                m.amount,
                COALESCE(m.village_city, 'Tamil Nadu') AS city,
                m.gift_type,
                m.created_at,
                f.name AS function_name
            FROM moi_entries m
            LEFT JOIN functions f ON m.function_id = f.id
            ORDER BY m.created_at DESC
            LIMIT 6;
        `);

        const recentTransactions = recentTxRes.rows.map(r => ({
            id: r.id,
            guestName: r.guest_name,
            amount: parseFloat(r.amount || 0),
            city: r.city,
            giftType: r.gift_type || 'CASH',
            createdAt: r.created_at,
            functionName: r.function_name || 'Event'
        }));

        return res.json({
            success: true,
            totalUsers,
            usersThisMonth,
            totalFunctions,
            totalMoiAmount,
            monthlyRevenue,
            avgMoiPerEvent,
            mostPopularPlan: mostPopularPlan.name,
            mostPopularPlanCount: mostPopularPlan.count,
            subscriptionStats: planDistribution,
            monthlyTrends,
            eventTypeDistribution,
            topDistricts,
            recentTransactions
        });
    } catch (error) {
        console.error("getAdminDashboard Error:", error);
        return res.status(500).json({ success: false, error: "Failed to fetch admin dashboard metrics." });
    }
};

// @desc Get All Registered Users with Subscription Details
// @route GET /api/admin/users
export const getAdminUsers = async (req, res) => {
    try {
        const { search, plan, status } = req.query;

        let query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                u.country_code,
                u.role,
                u.created_at,
                u.account_id,
                s.id AS subscription_id,
                s.status AS subscription_status,
                s.start_date,
                s.end_date,
                p.id AS plan_id,
                COALESCE(p.name, 'Free Plan') AS plan_name,
                COALESCE(p.price, 0) AS plan_price
            FROM users u
            LEFT JOIN (
                SELECT DISTINCT ON (account_id) *
                FROM subscriptions
                ORDER BY account_id, created_at DESC
            ) s ON u.account_id = s.account_id
            LEFT JOIN subscription_plans p ON s.plan_id = p.id
            WHERE 1=1
        `;

        const queryParams = [];

        if (search) {
            queryParams.push(`%${search.toLowerCase().trim()}%`);
            query += ` AND (LOWER(u.name) LIKE $${queryParams.length} OR LOWER(u.email) LIKE $${queryParams.length} OR u.phone LIKE $${queryParams.length})`;
        }

        if (plan && plan !== 'ALL') {
            queryParams.push(plan);
            query += ` AND (p.id = $${queryParams.length} OR LOWER(p.name) LIKE $${queryParams.length})`;
        }

        if (status && status !== 'ALL') {
            queryParams.push(status);
            query += ` AND s.status = $${queryParams.length}`;
        }

        query += ` ORDER BY u.created_at DESC;`;

        const result = await pool.query(query, queryParams);

        // Map status dynamically based on current date
        const now = new Date();
        const users = result.rows.map(user => {
            let currentStatus = user.subscription_status || 'TRIAL';
            if (user.end_date && new Date(user.end_date) < now && currentStatus !== 'CANCELLED') {
                currentStatus = 'EXPIRED';
            }
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                countryCode: user.country_code,
                role: user.role,
                createdAt: user.created_at,
                accountId: user.account_id,
                subscription: {
                    id: user.subscription_id,
                    planId: user.plan_id || 'PLAN_FREE',
                    planName: user.plan_name,
                    planPrice: user.plan_price,
                    status: currentStatus,
                    startDate: user.start_date,
                    endDate: user.end_date
                }
            };
        });

        return res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error("getAdminUsers Error:", error);
        return res.status(500).json({ success: false, error: "Failed to fetch users list." });
    }
};

// @desc Manually Activate or Update User Subscription
// @route PATCH /api/admin/users/:userId/subscription
export const updateUserSubscription = async (req, res) => {
    try {
        const { userId } = req.params;
        const { planId, duration, paymentMethod, amount, notes } = req.body;

        const accountId = await getUserAccountId(userId);
        if (!accountId) {
            return res.status(404).json({ success: false, error: "User account not found." });
        }

        // 1. Robust Plan Matching against subscription_plans DB table
        let planRes = await pool.query("SELECT * FROM subscription_plans WHERE id = $1 LIMIT 1;", [planId]);
        let plan = planRes.rows[0];

        if (!plan) {
            // Map common aliases (SILVER -> BASIC, GOLD -> STANDARD, PLATINUM -> PREMIUM)
            let searchAlias = (planId || '').replace('PLAN_', '').toLowerCase();
            if (searchAlias === 'silver') searchAlias = 'basic';
            if (searchAlias === 'gold') searchAlias = 'standard';
            if (searchAlias === 'platinum') searchAlias = 'premium';

            planRes = await pool.query(
                "SELECT * FROM subscription_plans WHERE LOWER(id) LIKE $1 OR LOWER(name) LIKE $1 LIMIT 1;",
                [`%${searchAlias}%`]
            );
            plan = planRes.rows[0];
        }

        // Fallback to first available active plan if still not matched
        if (!plan) {
            planRes = await pool.query("SELECT * FROM subscription_plans WHERE status = 'ACTIVE' ORDER BY price ASC LIMIT 1;");
            plan = planRes.rows[0];
        }

        if (!plan) {
            return res.status(400).json({ success: false, error: "No active subscription plan found in database." });
        }

        // 2. Calculate interval duration string for PostgreSQL
        let intervalStr = '1 year';
        if (duration === '1_MONTH') intervalStr = '1 month';
        else if (duration === '3_MONTHS') intervalStr = '3 months';
        else if (duration === '6_MONTHS') intervalStr = '6 months';
        else if (duration === '1_YEAR') intervalStr = '1 year';

        // 3. Upsert Subscription (Update existing or Insert new)
        const existingSub = await pool.query(
            "SELECT id FROM subscriptions WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1;",
            [accountId]
        );

        let subscription;
        if (existingSub.rows.length > 0) {
            const subId = existingSub.rows[0].id;
            const updateQuery = `
                UPDATE subscriptions
                SET plan_id = $1,
                    status = 'ACTIVE',
                    start_date = NOW(),
                    end_date = NOW() + $2::interval,
                    updated_at = NOW()
                WHERE id = $3
                RETURNING *;
            `;
            const updateRes = await pool.query(updateQuery, [plan.id, intervalStr, subId]);
            subscription = updateRes.rows[0];
        } else {
            const subId = `sub_${Date.now()}`;
            const insertQuery = `
                INSERT INTO subscriptions (id, account_id, plan_id, status, start_date, end_date, created_at, updated_at)
                VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW() + $4::interval, NOW(), NOW())
                RETURNING *;
            `;
            const insertRes = await pool.query(insertQuery, [subId, accountId, plan.id, intervalStr]);
            subscription = insertRes.rows[0];
        }

        // 4. Record Payment History
        const paymentId = `pay_${Date.now()}`;
        const paymentAmount = amount !== undefined ? parseFloat(amount) : parseFloat(plan.price || 0);

        await pool.query(`
            INSERT INTO payments (id, account_id, subscription_id, amount, currency, status, payment_date, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'INR', 'SUCCESS', NOW(), NOW(), NOW());
        `, [paymentId, accountId, subscription.id, paymentAmount]);

        return res.json({
            success: true,
            message: `Subscription successfully updated to ${plan.name} (${intervalStr})!`,
            subscription: {
                id: subscription.id,
                planId: plan.id,
                planName: plan.name,
                status: 'ACTIVE',
                startDate: subscription.start_date,
                endDate: subscription.end_date,
                paymentMethod: paymentMethod || 'CASH',
                amount: paymentAmount,
                notes: notes || ''
            }
        });
    } catch (error) {
        console.error("updateUserSubscription Error:", error);
        return res.status(500).json({ 
            success: false, 
            error: `Failed to update user subscription: ${error.message}` 
        });
    }
};
