import { readDB, writeDB } from '../config/db.js';

// @desc Get all expenses
// @route GET /api/expenses
export const getExpenses = (req, res) => {
    const db = readDB();
    const { functionId } = req.query;

    let expenses = db.expenses;
    if (functionId) {
        expenses = expenses.filter(e => e.functionId === functionId);
    }

    const totalExpense = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalPaid = expenses.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);

    res.json({
        success: true,
        count: expenses.length,
        totalExpense,
        totalPaid,
        pendingPayment: totalExpense - totalPaid,
        expenses
    });
};

// @desc Add expense
// @route POST /api/expenses
export const createExpense = (req, res) => {
    const { functionId, category, vendor, amount, paidAmount, status, date } = req.body;

    if (!category || !amount) {
        return res.status(400).json({ success: false, error: 'Category and amount are required.' });
    }

    const db = readDB();
    const newExpense = {
        id: `e_${Date.now()}`,
        functionId: functionId || (db.functions[0] ? db.functions[0].id : 'f_1'),
        userId: req.user?.id || 'u_demo_1',
        category,
        vendor: vendor || '',
        amount: Number(amount) || 0,
        paidAmount: Number(paidAmount) || Number(amount) || 0,
        status: status || 'Paid',
        date: date || new Date().toISOString().split('T')[0]
    };

    db.expenses.push(newExpense);
    writeDB(db);

    res.status(201).json({ success: true, expense: newExpense });
};

// @desc Delete expense
// @route DELETE /api/expenses/:id
export const deleteExpense = (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLen = db.expenses.length;
    db.expenses = db.expenses.filter(e => e.id !== id);

    if (db.expenses.length === initialLen) {
        return res.status(404).json({ success: false, error: 'Expense not found.' });
    }

    writeDB(db);
    res.json({ success: true, message: 'Expense entry deleted.' });
};
