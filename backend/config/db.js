import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "../data/db.json");

const { Pool } = pg;

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on("connect", () => {
    console.log("✅ PostgreSQL client connected");
});

pool.on("error", (error) => {
    console.error("❌ Unexpected PostgreSQL error:", error);
});

// Auto-initialize PostgreSQL tables
const initTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                country_code VARCHAR(10) DEFAULT '+91',
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log("✅ PostgreSQL 'users' table ready");
    } catch (e) {
        console.error("❌ Table initialization error:", e.message);
    }
};

initTables();

export const readDB = () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const initialData = { users: [], functions: [], moiEntries: [], expenses: [] };
            fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
            fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const data = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        return { users: [], functions: [], moiEntries: [], expenses: [] };
    }
};

export const writeDB = (data) => {
    try {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error writing to DB file:", e);
    }
};

export default pool;