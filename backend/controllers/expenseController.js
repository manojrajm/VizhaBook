import pool from '../config/db.js';

// Helper to get user's account_id
const getAccountId = async (userId, userEmail) => {
    let res = await pool.query(
        'SELECT account_id FROM users WHERE id = $1 LIMIT 1;',
        [userId]
    );
    if (!res.rows.length && userEmail) {
        res = await pool.query(
            'SELECT account_id FROM users WHERE LOWER(email) = $1 LIMIT 1;',
            [userEmail.toLowerCase()]
        );
    }
    return res.rows[0]?.account_id || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Get all expenses for authenticated user's account
// @route GET /api/expenses
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getExpenses = async (req, res) => {
    try {
        const accountId = await getAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const { functionId, category } = req.query;

        let query = `
            SELECT 
                e.id,
                e.account_id AS "accountId",
                e.function_id AS "functionId",
                f.name AS "functionName",
                e.title,
                e.category,
                e.amount,
                e.payment_mode AS "paymentMode",
                e.expense_date AS "expenseDate",
                e.expense_date AS "date",
                e.notes,
                e.notes AS "note",
                e.created_at AS "createdAt",
                e.updated_at AS "updatedAt"
            FROM expenses e
            JOIN functions f ON e.function_id = f.id
            WHERE e.account_id = $1
        `;

        const params = [accountId];
        let pIndex = 2;

        if (functionId && functionId !== 'all') {
            query += ` AND e.function_id = $${pIndex}`;
            params.push(functionId);
            pIndex++;
        }

        if (category && category !== 'all') {
            query += ` AND LOWER(e.category) = $${pIndex}`;
            params.push(category.toLowerCase());
            pIndex++;
        }

        query += ` ORDER BY e.expense_date DESC, e.created_at DESC;`;

        const result = await pool.query(query, params);
        const expenses = result.rows;

        const totalExpense = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        return res.json({
            success: true,
            count: expenses.length,
            totalExpense,
            expenses
        });
    } catch (e) {
        console.error("getExpenses error:", e.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch expenses.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Add new expense record to public.expenses
// @route POST /api/expenses
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const createExpense = async (req, res) => {
    try {
        const accountId = await getAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const {
            functionId,
            title,
            category,
            amount,
            paymentMode,
            expenseDate,
            date,
            notes,
            note
        } = req.body;

        const finalTitle = title || category || 'Expense Item';
        const finalAmount = Number(amount) || 0;
        const finalCategory = category || 'Other';
        const finalDate = expenseDate || date || new Date().toISOString().split('T')[0];
        const finalNotes = notes || note || null;

        if (!finalAmount || finalAmount <= 0) {
            return res.status(400).json({ success: false, error: 'Valid expense amount is required.' });
        }

        if (!functionId) {
            return res.status(400).json({ success: false, error: 'Function ID is required.' });
        }

        // Check function ownership
        const fnRes = await pool.query(
            "SELECT id, name FROM functions WHERE id = $1 AND account_id = $2 LIMIT 1;",
            [functionId, accountId]
        );
        if (!fnRes.rows.length) {
            return res.status(403).json({ success: false, error: 'Function not found or access denied.' });
        }

        const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

        const insertRes = await pool.query(
            `INSERT INTO expenses (
                id, account_id, function_id, title, category,
                amount, payment_mode, expense_date, notes,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9,
                NOW(), NOW()
            ) RETURNING *;`,
            [
                id,
                accountId,
                functionId,
                finalTitle.trim(),
                finalCategory.trim(),
                finalAmount,
                paymentMode || 'Cash',
                finalDate,
                finalNotes
            ]
        );

        const r = insertRes.rows[0];
        const formattedExpense = {
            id: r.id,
            accountId: r.account_id,
            functionId: r.function_id,
            functionName: fnRes.rows[0].name,
            title: r.title,
            category: r.category,
            amount: Number(r.amount),
            paymentMode: r.payment_mode,
            expenseDate: r.expense_date,
            date: r.expense_date,
            notes: r.notes,
            note: r.notes,
            createdAt: r.created_at
        };

        return res.status(201).json({
            success: true,
            expense: formattedExpense
        });
    } catch (e) {
        console.error("createExpense error:", e.message);
        return res.status(500).json({ success: false, error: 'Failed to record expense.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc Delete expense record
// @route DELETE /api/expenses/:id
// @access Protected
// ─────────────────────────────────────────────────────────────────────────────
export const deleteExpense = async (req, res) => {
    try {
        const accountId = await getAccountId(req.user.id, req.user.email);
        if (!accountId) {
            return res.status(404).json({ success: false, error: 'Account not found.' });
        }

        const { id } = req.params;

        const delRes = await pool.query(
            "DELETE FROM expenses WHERE id = $1 AND account_id = $2 RETURNING id;",
            [id, accountId]
        );

        if (!delRes.rows.length) {
            return res.status(404).json({ success: false, error: 'Expense not found or access denied.' });
        }

        return res.json({ success: true, message: 'Expense deleted successfully.' });
    } catch (e) {
        console.error("deleteExpense error:", e.message);
        return res.status(500).json({ success: false, error: 'Failed to delete expense.' });
    }
};
