import pool from '../config/db.js';

// Helper: Ensure user has account_id
const getUserAccountId = async (userId, userEmail) => {
    let res = await pool.query("SELECT account_id, id, name FROM users WHERE id = $1 LIMIT 1;", [userId]);
    if (!res.rows.length && userEmail) {
        res = await pool.query("SELECT account_id, id, name FROM users WHERE LOWER(email) = $1 LIMIT 1;", [userEmail.toLowerCase()]);
    }
    return res.rows[0]?.account_id || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Get all Moi entries for authenticated user's account
// @route GET /api/moi
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getMoiEntries = async (req, res) => {
    try {
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const { functionId, paymentMethodId, entrySource, giftType, search } = req.query;

        let query = `
            SELECT
                m.id,
                m.function_id AS "functionId",
                f.name AS "functionName",
                m.user_id AS "userId",
                m.guest_name AS "guestName",
                m.village_city AS "villageCity",
                m.phone,
                m.amount,
                m.gift_item AS "giftItem",
                m.gift_item AS "giftType",
                m.payment_mode AS "paymentMode",
                m.relation,
                m.payment_method_id AS "paymentMethodId",
                pm.name AS "paymentMethodName",
                pm.provider AS "paymentMethodProvider",
                pm.method_type AS "paymentMethodType",
                m.entry_source AS "entrySource",
                m.transaction_reference AS "transactionReference",
                m.created_at AS "createdAt",
                m.created_at AS "entryDate"
            FROM moi_entries m
            JOIN functions f ON m.function_id = f.id
            LEFT JOIN function_payment_methods pm ON m.payment_method_id = pm.id
            WHERE f.account_id = $1
        `;

        const params = [accountId];
        let pIndex = 2;

        if (functionId) {
            query += ` AND m.function_id = $${pIndex}`;
            params.push(functionId);
            pIndex++;
        }

        if (paymentMethodId) {
            if (paymentMethodId === 'UNSPECIFIED') {
                query += ` AND m.payment_method_id IS NULL`;
            } else {
                query += ` AND m.payment_method_id = $${pIndex}`;
                params.push(paymentMethodId);
                pIndex++;
            }
        }

        if (entrySource) {
            query += ` AND m.entry_source = $${pIndex}`;
            params.push(entrySource);
            pIndex++;
        }

        if (giftType && giftType !== 'ALL') {
            if (giftType === 'Cash') {
                query += ` AND (m.gift_item IS NULL OR m.gift_item = '' OR m.gift_item = 'Cash')`;
            } else {
                query += ` AND m.gift_item = $${pIndex}`;
                params.push(giftType);
                pIndex++;
            }
        }

        if (search && search.trim()) {
            query += ` AND (LOWER(m.guest_name) LIKE $${pIndex} OR LOWER(m.village_city) LIKE $${pIndex} OR m.phone LIKE $${pIndex} OR LOWER(m.transaction_reference) LIKE $${pIndex})`;
            params.push(`%${search.trim().toLowerCase()}%`);
            pIndex++;
        }

        query += ` ORDER BY m.created_at DESC;`;

        const result = await pool.query(query, params);
        const entries = result.rows;

        // Calculate KPI Metrics from query results
        const totalAmount = entries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const upiCollection = entries
            .filter(e => e.paymentMethodType === 'UPI' || e.paymentMode === 'UPI')
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const cashCollection = entries
            .filter(e => e.paymentMethodType === 'CASH' || e.paymentMode === 'Cash' || (!e.paymentMethodType && e.paymentMode !== 'UPI'))
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        // Payment provider distribution
        const paymentBreakdown = {};
        entries.forEach(e => {
            const key = e.paymentMethodName || e.paymentMode || 'Cash';
            paymentBreakdown[key] = (paymentBreakdown[key] || 0) + (Number(e.amount) || 0);
        });

        return res.json({
            success: true,
            count: entries.length,
            totalAmount,
            upiCollection,
            cashCollection,
            paymentBreakdown,
            entries
        });
    } catch (e) {
        console.error('getMoiEntries error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch Moi entries.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Create new Moi entry
// @route POST /api/moi
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const createMoiEntry = async (req, res) => {
    try {
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const {
            functionId,
            guestName,
            villageCity,
            phone,
            amount,
            giftItem,
            giftType,
            paymentMode,
            relation,
            paymentMethodId,
            entrySource,
            transactionReference
        } = req.body;

        if (!guestName || (!guestName.trim())) {
            return res.status(400).json({ success: false, error: 'Guest name is required.' });
        }

        if (!functionId) {
            return res.status(400).json({ success: false, error: 'Function ID is required.' });
        }

        // Check function ownership
        const fnRes = await pool.query(
            "SELECT id FROM functions WHERE id = $1 AND account_id = $2 LIMIT 1;",
            [functionId, accountId]
        );
        if (!fnRes.rows.length) {
            return res.status(403).json({ success: false, error: 'Function not found or access denied.' });
        }

        // Check subscription limits
        try {
            const subRes = await pool.query(
                "SELECT * FROM subscriptions WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1;",
                [accountId]
            );
            const sub = subRes.rows[0];
            const now = new Date();

            if (sub) {
                const endDate = new Date(sub.end_date);
                const isExpired = (sub.status === 'TRIAL' || sub.status === 'ACTIVE') && endDate < now;
                if (isExpired) {
                    return res.status(403).json({
                        success: false,
                        limitReached: true,
                        isExpired: true,
                        error: 'Your trial or subscription has expired. Please choose a plan to continue.'
                    });
                }
            }

            let entryLimit = 300; // Default trial limit
            if (sub && sub.plan_id) {
                const pRes = await pool.query("SELECT entry_limit FROM subscription_plans WHERE id = $1 LIMIT 1;", [sub.plan_id]);
                if (pRes.rows.length > 0) entryLimit = pRes.rows[0].entry_limit;
            }

            if (entryLimit !== null) {
                const countRes = await pool.query(
                    `SELECT COUNT(*) AS cnt FROM moi_entries m
                     JOIN functions f ON m.function_id = f.id
                     WHERE f.account_id = $1;`,
                    [accountId]
                );
                const currentCount = parseInt(countRes.rows[0].cnt, 10);
                if (currentCount >= entryLimit) {
                    return res.status(403).json({
                        success: false,
                        limitReached: true,
                        entryLimit,
                        error: `Moi entry limit reached (${entryLimit} max for your current plan). Please upgrade your plan to continue adding entries.`
                    });
                }
            }
        } catch (e) {
            console.warn("Moi entry subscription check error:", e.message);
        }

        // Validate optional payment method belongs to this function if supplied
        let validPaymentMethodId = null;
        if (paymentMethodId) {
            const pmCheck = await pool.query(
                "SELECT id FROM function_payment_methods WHERE id = $1 AND function_id = $2 LIMIT 1;",
                [paymentMethodId, functionId]
            );
            if (pmCheck.rows.length > 0) {
                validPaymentMethodId = paymentMethodId;
            }
        }

        const id = `m_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const validSource = ['manual', 'voice', 'qr_checkin', 'import'].includes(entrySource) ? entrySource : 'manual';
        const finalGiftItem = giftItem || giftType || 'Cash';
        const finalAmount = Number(amount) || 0;

        const insertRes = await pool.query(
            `INSERT INTO moi_entries (
                id, function_id, user_id, name, guest_name, village_city, phone,
                amount, gift_type, gift_item, payment_mode, relation,
                payment_method_id, entry_source, transaction_reference,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12,
                $13, $14, $15,
                NOW(), NOW()
            ) RETURNING *;`,
            [
                id,
                functionId,
                req.user.id,
                guestName.trim(),
                guestName.trim(),
                villageCity?.trim() || null,
                phone?.trim() || null,
                finalAmount,
                finalGiftItem,
                finalGiftItem,
                paymentMode || 'Cash',
                relation || 'Relative',
                validPaymentMethodId,
                validSource,
                transactionReference?.trim() || null
            ]
        );

        const r = insertRes.rows[0];
        const formattedEntry = {
            id: r.id,
            functionId: r.function_id,
            userId: r.user_id,
            guestName: r.guest_name,
            villageCity: r.village_city || '',
            phone: r.phone || '',
            amount: Number(r.amount) || 0,
            giftItem: r.gift_item || '',
            giftType: r.gift_item || '',
            paymentMode: r.payment_mode,
            relation: r.relation,
            paymentMethodId: r.payment_method_id,
            entrySource: r.entry_source,
            transactionReference: r.transaction_reference,
            createdAt: r.created_at,
            entryDate: r.created_at
        };

        return res.status(201).json({ success: true, entry: formattedEntry });
    } catch (e) {
        console.error('createMoiEntry error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to create Moi entry.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Update an existing Moi entry
// @route PUT /api/moi/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const updateMoiEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        // Ownership check via function's account_id
        const existing = await pool.query(
            `SELECT m.*, f.account_id
             FROM moi_entries m
             JOIN functions f ON m.function_id = f.id
             WHERE m.id = $1 AND f.account_id = $2
             LIMIT 1;`,
            [id, accountId]
        );
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Moi entry not found or access denied.' });
        }

        const {
            guestName,
            villageCity,
            phone,
            amount,
            giftItem,
            paymentMode,
            relation,
            paymentMethodId,
            transactionReference
        } = req.body;

        if (!guestName || !guestName.trim()) {
            return res.status(400).json({ success: false, error: 'Guest name is required.' });
        }

        const updateRes = await pool.query(
            `UPDATE moi_entries
             SET guest_name = $1, village_city = $2, phone = $3, amount = $4,
                 gift_item = $5, payment_mode = $6, relation = $7,
                 payment_method_id = $8, transaction_reference = $9, updated_at = NOW()
             WHERE id = $10
             RETURNING *;`,
            [
                guestName.trim(),
                villageCity?.trim() || null,
                phone?.trim() || null,
                Number(amount) || 0,
                giftItem || 'Cash',
                paymentMode || 'Cash',
                relation || 'Relative',
                paymentMethodId || null,
                transactionReference?.trim() || null,
                id
            ]
        );

        return res.json({ success: true, entry: updateRes.rows[0] });
    } catch (e) {
        console.error('updateMoiEntry error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to update Moi entry.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Delete Moi entry
// @route DELETE /api/moi/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const deleteMoiEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        // Ownership check
        const existing = await pool.query(
            `SELECT m.id FROM moi_entries m
             JOIN functions f ON m.function_id = f.id
             WHERE m.id = $1 AND f.account_id = $2
             LIMIT 1;`,
            [id, accountId]
        );
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Moi entry not found or access denied.' });
        }

        await pool.query("DELETE FROM moi_entries WHERE id = $1;", [id]);

        return res.json({ success: true, message: 'Moi entry deleted successfully.' });
    } catch (e) {
        console.error('deleteMoiEntry error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to delete Moi entry.' });
    }
};
