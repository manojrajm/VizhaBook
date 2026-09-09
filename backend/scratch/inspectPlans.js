import pool from '../config/db.js';

const inspectPlans = async () => {
    try {
        const res = await pool.query("SELECT * FROM subscription_plans;");
        console.log("📋 Current Subscription Plans in DB:", res.rows);
        process.exit(0);
    } catch (e) {
        console.error("Error inspecting plans:", e);
        process.exit(1);
    }
};

inspectPlans();
