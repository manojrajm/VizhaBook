import { readDB, writeDB } from '../config/db.js';

// @desc Get all Moi entries
// @route GET /api/moi
export const getMoiEntries = (req, res) => {
    const db = readDB();
    const { functionId } = req.query;

    let entries = db.moiEntries;
    if (functionId) {
        entries = entries.filter(m => m.functionId === functionId);
    }

    const totalAmount = entries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    res.json({
        success: true,
        count: entries.length,
        totalAmount,
        entries
    });
};

// @desc Create new Moi entry
// @route POST /api/moi
export const createMoiEntry = (req, res) => {
    const { functionId, guestName, villageCity, phone, amount, giftItem, paymentMode, relation } = req.body;

    if (!guestName || (!amount && !giftItem)) {
        return res.status(400).json({ success: false, error: 'Guest name and gift amount/item are required.' });
    }

    const db = readDB();
    const newEntry = {
        id: `m_${Date.now()}`,
        functionId: functionId || (db.functions[0] ? db.functions[0].id : 'f_1'),
        userId: req.user?.id || 'u_demo_1',
        guestName: guestName.trim(),
        villageCity: villageCity || '',
        phone: phone || '',
        amount: Number(amount) || 0,
        giftItem: giftItem || '',
        paymentMode: paymentMode || 'Cash',
        relation: relation || 'Guest',
        whatsappSent: true,
        createdAt: new Date().toISOString()
    };

    db.moiEntries.unshift(newEntry);
    writeDB(db);

    res.status(201).json({ success: true, entry: newEntry });
};

// @desc Delete Moi entry
// @route DELETE /api/moi/:id
export const deleteMoiEntry = (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLen = db.moiEntries.length;
    db.moiEntries = db.moiEntries.filter(m => m.id !== id);

    if (db.moiEntries.length === initialLen) {
        return res.status(404).json({ success: false, error: 'Moi entry not found.' });
    }

    writeDB(db);
    res.json({ success: true, message: 'Moi entry deleted.' });
};
