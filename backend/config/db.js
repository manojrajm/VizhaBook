import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});


// ===============================
// TEST DATABASE CONNECTION
// ===============================

pool.on("connect", () => {
    console.log("✅ PostgreSQL client connected");
});

pool.on("error", (error) => {
    console.error("❌ Unexpected PostgreSQL error:", error);
});


const testDatabase = async () => {
    try {

        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        console.log(
            "✅ PostgreSQL connected:",
            result.rows[0].current_time
        );

    } catch (error) {

        console.error(
            "❌ PostgreSQL connection failed:",
            error.message
        );

    }
};

testDatabase();

export default pool;