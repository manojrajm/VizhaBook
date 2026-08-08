import { readDB, writeDB } from '../config/db.js';

// @desc Get all functions
// @route GET /api/functions
export const getFunctions = (req, res) => {
    const db = readDB();
    res.json({ success: true, functions: db.functions });
};

// @desc Create new function
// @route POST /api/functions
export const createFunction = (req, res) => {
    const { title, type, date, venue, budget } = req.body;
    if (!title || !type || !date) {
        return res.status(400).json({ success: false, error: 'Title, type, and date are required.' });
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
