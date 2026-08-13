import pool from './config/db.js';

async function test() {
    try {
        console.log('--- DB QUERY TEST START ---');
        const fnId = 'fn_1786529974456';

        // Fixed Query 1: Payment methods list without ambiguous ORDER BY alias
        const res = await pool.query(
            `SELECT *,
                    COALESCE(display_name, name) as display_name,
                    COALESCE(priority, display_order, 0) as sort_priority
             FROM function_payment_methods
             WHERE function_id = $1
             ORDER BY is_default DESC, is_active DESC, display_order ASC, created_at ASC;`,
            [fnId]
        );
        console.log('QUERY 1 SUCCESS! Rows count:', res.rows.length, res.rows);

        // Query 2: Duplicate check
        const upiTest = 'manoj@oksbi';
        const dupCheck = await pool.query(
            `SELECT id FROM function_payment_methods
             WHERE function_id = $1 AND is_active = TRUE AND LOWER(upi_id) = $2
             LIMIT 1;`,
            [fnId, upiTest.toLowerCase()]
        );
        console.log('QUERY 2 DUP CHECK SUCCESS! Found count:', dupCheck.rows.length);

    } catch (e) {
        console.error('--- DB QUERY TEST FAILED ---');
        console.error(e);
    } finally {
        process.exit(0);
    }
}

test();
