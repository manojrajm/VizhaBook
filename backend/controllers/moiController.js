import { readDB, writeDB, pool } from '../config/db.js';

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
export const createMoiEntry = async (req, res) => {
    const { functionId, guestName, villageCity, phone, amount, giftItem, paymentMode, relation } = req.body;

    if (!guestName || (!amount && !giftItem)) {
        return res.status(400).json({ success: false, error: 'Guest name and gift amount/item are required.' });
    }

    // Check subscription limits if user is authenticated
    if (req.user && req.user.id) {
        try {
            const uRes = await pool.query("SELECT account_id FROM users WHERE id = $1 LIMIT 1;", [req.user.id]);
            const accountId = uRes.rows[0]?.account_id;
            if (accountId) {
                const subRes = await pool.query(
                    "SELECT * FROM subscriptions WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1;",
                    [accountId]
                );
                const sub = subRes.rows[0];
                const now = new Date();
                const endDate = sub ? new Date(sub.end_date) : new Date(0);
                const isExpired = sub ? ((sub.status === 'TRIAL' || sub.status === 'ACTIVE') && endDate < now) : false;

                if (isExpired) {
                    return res.status(403).json({
                        success: false,
                        limitReached: true,
                        isExpired: true,
                        error: 'Your trial or subscription has expired. Please choose a subscription plan to continue.'
                    });
                }

                let entryLimit = 300; // Default trial limit
                if (sub && sub.plan_id) {
                    const pRes = await pool.query("SELECT entry_limit FROM subscription_plans WHERE id = $1 LIMIT 1;", [sub.plan_id]);
                    if (pRes.rows.length > 0) {
                        entryLimit = pRes.rows[0].entry_limit;
                    }
                }

                if (entryLimit !== null) {
                    const db = readDB();
                    const existingCount = db.moiEntries.length;
                    if (existingCount >= entryLimit) {
                        return res.status(403).json({
                            success: false,
                            limitReached: true,
                            entryLimit,
                            error: `Moi entry limit reached (${entryLimit} max for your current plan). Please upgrade your plan to continue adding entries.`
                        });
                    }
                }
            }
        } catch (e) {
            console.warn("Moi entry subscription check error:", e.message);
        }
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
