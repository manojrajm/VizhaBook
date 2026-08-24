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

// ─────────────────────────────────────────────────────────────────────────────
// @desc Submit pending QR check-in entry (PUBLIC for Mobile Guests)
// @route POST /api/moi/pending
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
export const submitPendingCheckin = async (req, res) => {
    try {
        const {
            functionId, functionName, guestName, phone, relation,
            giftType, amount, paymentMode, upiId, utr, description
        } = req.body;

        if (!functionId || !guestName) {
            return res.status(400).json({ success: false, error: 'Function ID and Guest Name are required.' });
        }

        const id = `pend_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        const result = await pool.query(
            `INSERT INTO function_pending_entries (
                id, function_id, function_name, guest_name, phone, relation,
                gift_type, amount, payment_mode, upi_id, utr, description, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING')
            RETURNING *;`,
            [
                id, functionId, functionName || null, guestName, phone || null, relation || 'Relative',
                giftType || 'Cash', amount || 0, paymentMode || 'Cash', upiId || null, utr || null, description || null
            ]
        );

        return res.status(201).json({
            success: true,
            pendingEntry: result.rows[0]
        });
    } catch (e) {
        console.error('submitPendingCheckin error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to submit pending QR check-in.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Get all pending QR check-in entries for host
// @route GET /api/moi/pending
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingCheckins = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*,
                    p.function_id AS "functionId",
                    p.function_name AS "functionName",
                    p.guest_name AS "guestName",
                    p.gift_type AS "giftType",
                    p.payment_mode AS "paymentMode",
                    p.created_at AS "submittedAt"
             FROM function_pending_entries p
             WHERE p.status = 'PENDING'
             ORDER BY p.created_at DESC;`
        );

        return res.json({
            success: true,
            pendingEntries: result.rows
        });
    } catch (e) {
        console.error('getPendingCheckins error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch pending check-ins.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Approve a pending QR check-in entry & convert to official Moi entry
// @route POST /api/moi/pending/:id/approve
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const approvePendingCheckin = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { amount, guestName, relation, phone } = req.body;

        await client.query('BEGIN');

        // Fetch pending entry & lock row
        const pendRes = await client.query(
            `SELECT p.* FROM function_pending_entries p
             WHERE p.id = $1
             FOR UPDATE;`,
            [id]
        );

        if (!pendRes.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Pending entry not found.' });
        }

        const pend = pendRes.rows[0];

        // Idempotency check: If already approved, return success without duplicate insert
        if (pend.status === 'APPROVED') {
            await client.query('COMMIT');
            return res.json({ success: true, message: 'Already approved.', entry: pend });
        }

        // Find user_id from matching account_id of function
        let userId = req.user?.id;
        if (!userId) {
            const userRes = await client.query(
                `SELECT u.id FROM users u
                 JOIN functions f ON u.account_id = f.account_id
                 WHERE f.id = $1 LIMIT 1;`,
                [pend.function_id]
            );
            userId = userRes.rows[0]?.id;
        }
        if (!userId) {
            const fallbackUser = await client.query("SELECT id FROM users LIMIT 1;");
            userId = fallbackUser.rows[0]?.id;
        }

        // Insert official Moi entry
        const entryId = `moi_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const finalName = guestName || pend.guest_name;
        const finalAmount = amount !== undefined ? parseFloat(amount) : parseFloat(pend.amount);
        const finalRelation = relation || pend.relation;
        const finalPhone = phone || pend.phone;

        const insertRes = await client.query(
            `INSERT INTO moi_entries (
                id, function_id, user_id, name, guest_name, phone, amount,
                gift_item, payment_mode, relation, entry_source, transaction_reference, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'qr_checkin', $11, NOW())
            RETURNING *;`,
            [
                entryId, pend.function_id, userId, finalName, finalName, finalPhone,
                finalAmount, pend.gift_type || 'Cash', pend.payment_mode || 'Cash',
                finalRelation, pend.utr || null
            ]
        );

        // Update pending status to APPROVED
        await client.query(
            "UPDATE function_pending_entries SET status = 'APPROVED' WHERE id = $1;",
            [id]
        );

        await client.query('COMMIT');

        return res.json({
            success: true,
            entry: insertRes.rows[0],
            message: 'Pending entry approved successfully.'
        });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('approvePendingCheckin error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to approve pending check-in.' });
    } finally {
        client.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Reject / Delete a pending QR check-in entry
// @route DELETE /api/moi/pending/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const rejectPendingCheckin = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `DELETE FROM function_pending_entries WHERE id = $1;`,
            [id]
        );

        return res.json({ success: true, message: 'Pending check-in rejected.' });
    } catch (e) {
        console.error('rejectPendingCheckin error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to reject pending check-in.' });
    }
};
