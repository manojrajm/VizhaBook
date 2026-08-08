import { readDB } from '../config/db.js';

// @desc Get financial analytics & overall ledger summary
// @route GET /api/reports/summary
export const getSummary = (req, res) => {
    const db = readDB();

    const totalFunctions = db.functions.length;
    const totalMoi = db.moiEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpenses = db.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const netBalance = totalMoi - totalExpenses;

    res.json({
        success: true,
        summary: {
            totalFunctions,
            totalMoi,
            totalExpenses,
            netBalance,
            totalGuests: db.moiEntries.length,
            recentEntries: db.moiEntries.slice(0, 5)
        }
    });
};
