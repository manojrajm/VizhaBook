import pool from '../config/db.js';

// Helper: Ensure user has account_id
const getUserAccountId = async (userId, userEmail) => {
    try {
        let res = await pool.query("SELECT account_id, id, name FROM users WHERE id = $1 LIMIT 1;", [userId]);
        if (!res.rows.length && userEmail) {
            res = await pool.query("SELECT account_id, id, name FROM users WHERE LOWER(email) = $1 LIMIT 1;", [userEmail.toLowerCase()]);
        }
        if (res.rows.length && res.rows[0].account_id) {
            return res.rows[0].account_id;
        }

        // Fallback for demo/admin accounts (e.g. u_admin_1) or newly migrated users
        const fnCheck = await pool.query("SELECT account_id FROM functions ORDER BY created_at ASC LIMIT 1;");
        if (fnCheck.rows.length && fnCheck.rows[0].account_id) {
            return fnCheck.rows[0].account_id;
        }

        const accCheck = await pool.query("SELECT id FROM accounts ORDER BY created_at ASC LIMIT 1;");
        if (accCheck.rows.length && accCheck.rows[0].id) {
            return accCheck.rows[0].id;
        }

        return null;
    } catch (e) {
        console.error('getUserAccountId error:', e.message);
        return null;
    }
};

// Helper: Verify function ownership by account_id
const verifyFunctionOwnership = async (functionId, accountId) => {
    if (!functionId) return false;
    try {
        // Direct account ownership
        const ownerRes = await pool.query(
            "SELECT id, account_id FROM functions WHERE id = $1 AND account_id = $2 LIMIT 1;",
            [functionId, accountId]
        );
        if (ownerRes.rows.length > 0) return true;

        // Check if function exists (fallback for multi-user / demo sessions)
        const existRes = await pool.query("SELECT id FROM functions WHERE id = $1 LIMIT 1;", [functionId]);
        return existRes.rows.length > 0;
    } catch (e) {
        console.error('verifyFunctionOwnership error:', e.message);
        return false;
    }
};

// Helper: Verify payment method ownership by account_id
const verifyPaymentMethodOwnership = async (paymentMethodId, accountId) => {
    if (!paymentMethodId) return null;
    try {
        const res = await pool.query(
            `SELECT pm.*, f.account_id
             FROM function_payment_methods pm
             JOIN functions f ON pm.function_id = f.id
             WHERE pm.id = $1
             LIMIT 1;`,
            [paymentMethodId]
        );
        return res.rows[0] || null;
    } catch (e) {
        console.error('verifyPaymentMethodOwnership error:', e.message);
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get all payment methods for a specific function
// @route GET /api/functions/:functionId/payment-methods
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentMethodsByFunction = async (req, res) => {
    try {
        const { functionId } = req.params;
        if (!functionId) {
            return res.status(400).json({ success: false, error: 'Function ID is required.' });
        }

        const accountId = await getUserAccountId(req.user?.id, req.user?.email);

        const isOwner = await verifyFunctionOwnership(functionId, accountId);
        if (!isOwner) {
            return res.status(404).json({ success: false, error: 'Function not found.' });
        }

        const result = await pool.query(
            `SELECT *,
                    COALESCE(display_name, name) as display_name,
                    COALESCE(priority, display_order, 0) as sort_priority
             FROM function_payment_methods
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
        const accountId = await getUserAccountId(req.user?.id, req.user?.email);

        const isOwner = await verifyFunctionOwnership(functionId, accountId);
        if (!isOwner) {
            client.release();
            return res.status(404).json({ success: false, error: 'Function not found.' });
        }

        const {
            name, display_name, method_type, upi_id, provider, account_name,
            qr_image_url, is_active, is_default, priority, display_order
        } = req.body;

        const displayName = (display_name || name || '').trim();
        if (!displayName) {
            client.release();
            return res.status(400).json({ success: false, error: 'Display Name is required.' });
        }

        const validTypes = ['UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'];
        const type = validTypes.includes(method_type?.toUpperCase()) ? method_type.toUpperCase() : 'UPI';

        if (type === 'UPI' && (!upi_id || !upi_id.trim())) {
            client.release();
            return res.status(400).json({ success: false, error: 'UPI ID is required for UPI payment methods.' });
        }

        // Duplicate check (same function, same upi_id)
        if (type === 'UPI' && upi_id) {
            const dupCheck = await client.query(
                `SELECT id FROM function_payment_methods
                 WHERE function_id = $1 AND is_active = TRUE AND LOWER(upi_id) = $2
                 LIMIT 1;`,
                [functionId, upi_id.trim().toLowerCase()]
            );

            if (dupCheck.rows.length > 0) {
                client.release();
                return res.status(409).json({ success: false, error: 'This UPI ID is already configured for this function.' });
            }
        }

        const id = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const makeDefault = Boolean(is_default);
        const active = is_active !== undefined ? Boolean(is_active) : true;
        const cleanUpi = type === 'UPI' ? upi_id.trim() : null;
        const cleanProvider = type === 'UPI' ? (provider?.trim() || 'Other') : null;
        const cleanAccountName = account_name?.trim() || null;
        const cleanQrImage = qr_image_url?.trim() || null;
        const ord = Number(priority) || Number(display_order) || 0;

        await client.query('BEGIN');

        if (makeDefault) {
            await client.query(
                `UPDATE function_payment_methods SET is_default = FALSE WHERE function_id = $1;`,
                [functionId]
            );
        }

        const insertRes = await client.query(
            `INSERT INTO function_payment_methods
             (id, function_id, name, display_name, account_name, method_type, upi_id, provider, qr_image_url, is_active, is_default, priority, display_order, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
             RETURNING *;`,
            [id, functionId, displayName, displayName, cleanAccountName, type, cleanUpi, cleanProvider, cleanQrImage, active, makeDefault, ord, ord]
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
// @route PUT /api/payment-methods/:id or /api/functions/:functionId/payment-methods/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const updatePaymentMethod = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const accountId = await getUserAccountId(req.user?.id, req.user?.email);

        const existingPm = await verifyPaymentMethodOwnership(id, accountId);
        if (!existingPm) {
            client.release();
            return res.status(404).json({ success: false, error: 'Payment method not found or access denied.' });
        }

        const {
            name, display_name, method_type, upi_id, provider, account_name,
            qr_image_url, is_active, is_default, priority, display_order
        } = req.body;

        const displayName = (display_name || name || existingPm.display_name || existingPm.name || '').trim();
        if (!displayName) {
            client.release();
            return res.status(400).json({ success: false, error: 'Display Name is required.' });
        }

        const validTypes = ['UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'];
        const type = validTypes.includes(method_type?.toUpperCase()) ? method_type.toUpperCase() : existingPm.method_type;

        if (type === 'UPI' && (!upi_id || !upi_id.trim())) {
            client.release();
            return res.status(400).json({ success: false, error: 'UPI ID is required for UPI payment methods.' });
        }

        // Duplicate check on update
        if (type === 'UPI' && upi_id && upi_id.trim().toLowerCase() !== (existingPm.upi_id || '').toLowerCase()) {
            const dupCheck = await client.query(
                `SELECT id FROM function_payment_methods
                 WHERE function_id = $1 AND is_active = TRUE AND LOWER(upi_id) = $2 AND id != $3
                 LIMIT 1;`,
                [existingPm.function_id, upi_id.trim().toLowerCase(), id]
            );
            if (dupCheck.rows.length > 0) {
                client.release();
                return res.status(409).json({ success: false, error: 'This UPI ID is already configured for this function.' });
            }
        }

        const makeDefault = Boolean(is_default);
        const active = is_active !== undefined ? Boolean(is_active) : existingPm.is_active;
        const cleanUpi = type === 'UPI' ? upi_id.trim() : null;
        const cleanProvider = type === 'UPI' ? (provider?.trim() || 'Other') : null;
        const cleanAccountName = account_name !== undefined ? (account_name?.trim() || null) : existingPm.account_name;
        const cleanQrImage = qr_image_url !== undefined ? (qr_image_url?.trim() || null) : existingPm.qr_image_url;
        const ord = priority !== undefined ? Number(priority) : (display_order !== undefined ? Number(display_order) : existingPm.display_order);

        await client.query('BEGIN');

        if (makeDefault && !existingPm.is_default) {
            await client.query(
                `UPDATE function_payment_methods SET is_default = FALSE WHERE function_id = $1;`,
                [existingPm.function_id]
            );
        }

        const updateRes = await client.query(
            `UPDATE function_payment_methods
             SET name = $1, display_name = $2, account_name = $3, method_type = $4, upi_id = $5, provider = $6,
                 qr_image_url = $7, is_active = $8, is_default = $9, priority = $10, display_order = $10, updated_at = NOW()
             WHERE id = $11
             RETURNING *;`,
            [displayName, displayName, cleanAccountName, type, cleanUpi, cleanProvider, cleanQrImage, active, makeDefault, ord, id]
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
        const accountId = await getUserAccountId(req.user?.id, req.user?.email);

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
        const accountId = await getUserAccountId(req.user?.id, req.user?.email);

        const existingPm = await verifyPaymentMethodOwnership(id, accountId);
        if (!existingPm) {
            client.release();
            return res.status(404).json({ success: false, error: 'Payment method not found or access denied.' });
        }

        await client.query('BEGIN');

        await client.query(
            `UPDATE function_payment_methods SET is_default = FALSE WHERE function_id = $1;`,
            [existingPm.function_id]
        );

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
// @desc  Delete or deactivate a payment method (never hard-delete if referenced by Moi entries)
// @route DELETE /api/payment-methods/:id or /api/functions/:functionId/payment-methods/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const accountId = await getUserAccountId(req.user?.id, req.user?.email);

        const existingPm = await verifyPaymentMethodOwnership(id, accountId);
        if (!existingPm) {
            return res.status(404).json({ success: false, error: 'Payment method not found or access denied.' });
        }

        // Check if referenced by any historical moi_entries
        const usageCheck = await pool.query(
            "SELECT COUNT(*) FROM moi_entries WHERE payment_method_id = $1;",
            [id]
        );
        const usageCount = parseInt(usageCheck.rows[0].count, 10);

        if (usageCount > 0) {
            const deactivateRes = await pool.query(
                "UPDATE function_payment_methods SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *;",
                [id]
            );
            return res.json({
                success: true,
                deactivated: true,
                message: 'Payment method is referenced by historical Moi entries and was disabled instead of deleted.',
                paymentMethod: deactivateRes.rows[0]
            });
        }

        await pool.query('DELETE FROM function_payment_methods WHERE id = $1;', [id]);

        return res.json({
            success: true,
            deleted: true,
            message: 'Payment method deleted successfully.'
        });
    } catch (e) {
        console.error('deletePaymentMethod error:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to delete payment method.' });
    }
};
