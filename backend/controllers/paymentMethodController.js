import pool from '../config/db.js';

// Helper: Ensure user has account_id
const getUserAccountId = async (userId, userEmail) => {
    let res = await pool.query("SELECT account_id, id, name FROM users WHERE id = $1 LIMIT 1;", [userId]);
    if (!res.rows.length && userEmail) {
        res = await pool.query("SELECT account_id, id, name FROM users WHERE LOWER(email) = $1 LIMIT 1;", [userEmail.toLowerCase()]);
    }
    return res.rows[0]?.account_id || null;
};

// Helper: Verify function ownership by account_id
const verifyFunctionOwnership = async (functionId, accountId) => {
    const res = await pool.query(
        "SELECT id, name FROM functions WHERE id = $1 AND account_id = $2 LIMIT 1;",
        [functionId, accountId]
    );
    return res.rows.length > 0;
};

// Helper: Verify payment method ownership by account_id
const verifyPaymentMethodOwnership = async (paymentMethodId, accountId) => {
    const res = await pool.query(
        `SELECT pm.*, f.account_id
         FROM function_payment_methods pm
         JOIN functions f ON pm.function_id = f.id
         WHERE pm.id = $1 AND f.account_id = $2
         LIMIT 1;`,
        [paymentMethodId, accountId]
    );
    return res.rows[0] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get all payment methods for a specific function
// @route GET /api/functions/:functionId/payment-methods
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentMethodsByFunction = async (req, res) => {
    try {
        const { functionId } = req.params;
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const isOwner = await verifyFunctionOwnership(functionId, accountId);
        if (!isOwner) {
            return res.status(403).json({ success: false, error: 'Access denied to this function.' });
        }

        const result = await pool.query(
            `SELECT * FROM function_payment_methods
             WHERE function_id = $1
             ORDER BY is_default DESC, is_active DESC, display_order ASC, created_at ASC;`,
            [functionId]
        );

        return res.json({
            success: true,
            paymentMethods: result.rows
        });
    } catch (e) {
        console.error('getPaymentMethodsByFunction error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch payment methods.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Create a new payment method for a function
// @route POST /api/functions/:functionId/payment-methods
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const createPaymentMethod = async (req, res) => {
    const client = await pool.connect();
    try {
        const { functionId } = req.params;
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            client.release();
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const isOwner = await verifyFunctionOwnership(functionId, accountId);
        if (!isOwner) {
            client.release();
            return res.status(403).json({ success: false, error: 'Access denied to this function.' });
        }

        const { name, method_type, upi_id, provider, is_active, is_default, display_order } = req.body;

        if (!name || !name.trim()) {
            client.release();
            return res.status(400).json({ success: false, error: 'Payment method name is required.' });
        }

        const validTypes = ['UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'];
        const type = validTypes.includes(method_type?.toUpperCase()) ? method_type.toUpperCase() : 'UPI';

        if (type === 'UPI' && (!upi_id || !upi_id.trim())) {
            client.release();
            return res.status(400).json({ success: false, error: 'UPI ID is required for UPI payment methods.' });
        }

        // Duplicate check (same function, same name or upi_id)
        const dupCheck = await client.query(
            `SELECT id FROM function_payment_methods
             WHERE function_id = $1 AND (LOWER(name) = $2 OR (upi_id IS NOT NULL AND LOWER(upi_id) = $3))
             LIMIT 1;`,
            [functionId, name.trim().toLowerCase(), upi_id ? upi_id.trim().toLowerCase() : '']
        );

        if (dupCheck.rows.length > 0) {
            client.release();
            return res.status(409).json({ success: false, error: 'This payment method or UPI ID is already configured for this function.' });
        }

        const id = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const makeDefault = Boolean(is_default);
        const active = is_active !== undefined ? Boolean(is_active) : true;
        const cleanUpi = type === 'UPI' ? upi_id.trim() : null;
        const cleanProvider = type === 'UPI' ? (provider?.trim() || 'Other') : null;

        await client.query('BEGIN');

        if (makeDefault) {
            await client.query(
                `UPDATE function_payment_methods SET is_default = FALSE WHERE function_id = $1;`,
                [functionId]
            );
        }

        const insertRes = await client.query(
            `INSERT INTO function_payment_methods
             (id, function_id, name, method_type, upi_id, provider, is_active, is_default, display_order, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
             RETURNING *;`,
            [id, functionId, name.trim(), type, cleanUpi, cleanProvider, active, makeDefault, Number(display_order) || 0]
        );

        await client.query('COMMIT');
        client.release();

        return res.status(201).json({
            success: true,
            paymentMethod: insertRes.rows[0]
        });
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        console.error('createPaymentMethod error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to create payment method.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update an existing payment method
// @route PUT /api/payment-methods/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const updatePaymentMethod = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            client.release();
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const existingPm = await verifyPaymentMethodOwnership(id, accountId);
        if (!existingPm) {
            client.release();
            return res.status(404).json({ success: false, error: 'Payment method not found or access denied.' });
        }

        const { name, method_type, upi_id, provider, is_active, is_default, display_order } = req.body;

        if (!name || !name.trim()) {
            client.release();
            return res.status(400).json({ success: false, error: 'Payment method name is required.' });
        }

        const validTypes = ['UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'];
        const type = validTypes.includes(method_type?.toUpperCase()) ? method_type.toUpperCase() : existingPm.method_type;

        if (type === 'UPI' && (!upi_id || !upi_id.trim())) {
            client.release();
            return res.status(400).json({ success: false, error: 'UPI ID is required for UPI payment methods.' });
        }

        const makeDefault = Boolean(is_default);
        const active = is_active !== undefined ? Boolean(is_active) : existingPm.is_active;
        const cleanUpi = type === 'UPI' ? upi_id.trim() : null;
        const cleanProvider = type === 'UPI' ? (provider?.trim() || 'Other') : null;

        await client.query('BEGIN');

        if (makeDefault && !existingPm.is_default) {
            await client.query(
                `UPDATE function_payment_methods SET is_default = FALSE WHERE function_id = $1;`,
                [existingPm.function_id]
            );
        }

        const updateRes = await client.query(
            `UPDATE function_payment_methods
             SET name = $1, method_type = $2, upi_id = $3, provider = $4, is_active = $5, is_default = $6, display_order = $7, updated_at = NOW()
             WHERE id = $8
             RETURNING *;`,
            [name.trim(), type, cleanUpi, cleanProvider, active, makeDefault, Number(display_order) || 0, id]
        );

        await client.query('COMMIT');
        client.release();

        return res.json({
            success: true,
            paymentMethod: updateRes.rows[0]
        });
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        console.error('updatePaymentMethod error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to update payment method.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Toggle active status of a payment method
// @route PATCH /api/payment-methods/:id/status
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const togglePaymentMethodStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const existingPm = await verifyPaymentMethodOwnership(id, accountId);
        if (!existingPm) {
            return res.status(404).json({ success: false, error: 'Payment method not found or access denied.' });
        }

        const { is_active } = req.body;
        const newStatus = is_active !== undefined ? Boolean(is_active) : !existingPm.is_active;

        const updateRes = await pool.query(
            `UPDATE function_payment_methods
             SET is_active = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *;`,
            [newStatus, id]
        );

        return res.json({
            success: true,
            paymentMethod: updateRes.rows[0]
        });
    } catch (e) {
        console.error('togglePaymentMethodStatus error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to update payment method status.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Set a payment method as default for its function (transactional)
// @route PATCH /api/payment-methods/:id/default
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const setDefaultPaymentMethod = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            client.release();
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const existingPm = await verifyPaymentMethodOwnership(id, accountId);
        if (!existingPm) {
            client.release();
            return res.status(404).json({ success: false, error: 'Payment method not found or access denied.' });
        }

        await client.query('BEGIN');

        // Unset previous defaults for this function
        await client.query(
            `UPDATE function_payment_methods SET is_default = FALSE WHERE function_id = $1;`,
            [existingPm.function_id]
        );

        // Set selected method as default
        const updateRes = await client.query(
            `UPDATE function_payment_methods SET is_default = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *;`,
            [id]
        );

        await client.query('COMMIT');
        client.release();

        return res.json({
            success: true,
            paymentMethod: updateRes.rows[0]
        });
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        console.error('setDefaultPaymentMethod error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to set default payment method.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Delete a payment method (owned)
// @route DELETE /api/payment-methods/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const accountId = await getUserAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const existingPm = await verifyPaymentMethodOwnership(id, accountId);
        if (!existingPm) {
            return res.status(404).json({ success: false, error: 'Payment method not found or access denied.' });
        }

        await pool.query('DELETE FROM function_payment_methods WHERE id = $1;', [id]);

        return res.json({
            success: true,
            message: 'Payment method deleted successfully.'
        });
    } catch (e) {
        console.error('deletePaymentMethod error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to delete payment method.' });
    }
};
