import pool from './db.js';

export const userQuery = {
    async findFirst({ where }) {
        if (!where) return null;
        let query = "SELECT * FROM users WHERE ";
        const values = [];
        const conditions = [];

        if (where.OR && Array.isArray(where.OR)) {
            const orConditions = [];
            where.OR.forEach((cond) => {
                if (cond.email) {
                    values.push(cond.email.toLowerCase());
                    orConditions.push(`LOWER(email) = $${values.length}`);
                }
                if (cond.phone) {
                    values.push(cond.phone);
                    orConditions.push(`phone = $${values.length}`);
                }
            });
            if (orConditions.length > 0) {
                conditions.push(`(${orConditions.join(' OR ')})`);
            }
        } else {
            if (where.email) {
                values.push(where.email.toLowerCase());
                conditions.push(`LOWER(email) = $${values.length}`);
            }
            if (where.phone) {
                values.push(where.phone);
                conditions.push(`phone = $${values.length}`);
            }
        }

        if (conditions.length === 0) return null;
        query += conditions.join(' AND ') + " LIMIT 1;";

        try {
            const res = await pool.query(query, values);
            return res.rows[0] || null;
        } catch (e) {
            console.error("PG userQuery findFirst Error:", e.message);
            return null;
        }
    },

    async findUnique({ where }) {
        if (!where || !where.id) return null;
        try {
            const res = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1;", [where.id]);
            return res.rows[0] || null;
        } catch (e) {
            return null;
        }
    },

    async create({ data }) {
        const id = `u_${Date.now()}`;
        let accountId = data.accountId;

        if (!accountId) {
            const accName = (data.account && data.account.create && data.account.create.name) 
                ? data.account.create.name 
                : `${data.name}'s Account`;
            const newAccId = `acc_${Date.now()}`;
            const accQuery = `
                INSERT INTO accounts (id, name, status, created_at, updated_at)
                VALUES ($1, $2, 'ACTIVE', NOW(), NOW())
                RETURNING id;
            `;
            const accRes = await pool.query(accQuery, [newAccId, accName]);
            accountId = accRes.rows[0].id;
        }

        const query = `
            INSERT INTO users (id, name, email, phone, country_code, password, role, account_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *;
        `;
        const values = [id, data.name, data.email, data.phone || '', data.countryCode || '+91', data.password, 'USER', accountId];
        const res = await pool.query(query, values);
        return res.rows[0];
    }
};

export default {
    user: userQuery
};
