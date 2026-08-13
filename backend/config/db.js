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

// Auto-initialize PostgreSQL tables & Account + Role Migration
const initTables = async () => {
    try {
        // 1. Create accounts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'ACTIVE',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 2. Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                country_code VARCHAR(10) DEFAULT '+91',
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'USER',
                account_id VARCHAR(100) REFERENCES accounts(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 3. Add missing columns safely if users table already existed
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER';
        `);
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS account_id VARCHAR(100) REFERENCES accounts(id);
        `);

        // 4. Backfill existing users missing account_id
        await pool.query(`
            DO $$
            DECLARE
                u RECORD;
                new_acc_id VARCHAR(100);
            BEGIN
                FOR u IN SELECT id, name FROM users WHERE account_id IS NULL LOOP
                    new_acc_id := 'acc_' || md5(u.id || random()::text);
                    INSERT INTO accounts (id, name, status, created_at, updated_at)
                    VALUES (new_acc_id, u.name || '''s Account', 'ACTIVE', NOW(), NOW());
                    
                    UPDATE users
                    SET account_id = new_acc_id, role = 'USER'
                    WHERE id = u.id;
                END LOOP;
            END $$;
        `);

        // 5. Enforce NOT NULL constraints on account_id and role
        await pool.query(`
            ALTER TABLE users ALTER COLUMN role SET NOT NULL;
            ALTER TABLE users ALTER COLUMN account_id SET NOT NULL;
        `);

        console.log("✅ PostgreSQL 'accounts' & 'users' tables ready with Account + Role migration and NOT NULL constraints");

        // 6. Create functions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS functions (
                id VARCHAR(100) PRIMARY KEY,
                account_id VARCHAR(100) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
                name VARCHAR(150) NOT NULL,
                event_date DATE NOT NULL,
                location VARCHAR(255),
                description TEXT,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 7. Indexes for functions
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_functions_account_id ON functions(account_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_functions_account_event_date ON functions(account_id, event_date);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_functions_account_status ON functions(account_id, status);`);

        console.log("✅ PostgreSQL 'functions' table and indexes ready");

        // 8. Create function_payment_methods table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS function_payment_methods (
                id VARCHAR(100) PRIMARY KEY,
                function_id VARCHAR(255) NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
                name VARCHAR(100),
                display_name VARCHAR(100),
                account_name VARCHAR(150),
                method_type VARCHAR(30) NOT NULL DEFAULT 'upi',
                upi_id VARCHAR(255),
                provider VARCHAR(50),
                qr_data TEXT,
                qr_image_url TEXT,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                is_default BOOLEAN NOT NULL DEFAULT FALSE,
                priority INTEGER DEFAULT 0,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add missing columns safely if function_payment_methods already existed
        await pool.query(`ALTER TABLE function_payment_methods ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);`);
        await pool.query(`ALTER TABLE function_payment_methods ADD COLUMN IF NOT EXISTS account_name VARCHAR(150);`);
        await pool.query(`ALTER TABLE function_payment_methods ADD COLUMN IF NOT EXISTS qr_image_url TEXT;`);
        await pool.query(`ALTER TABLE function_payment_methods ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;`);

        // 9. Create moi_entries table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS moi_entries (
                id VARCHAR(100) PRIMARY KEY,
                function_id VARCHAR(255) NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
                user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
                guest_name VARCHAR(255) NOT NULL,
                village_city VARCHAR(255),
                phone VARCHAR(50),
                amount NUMERIC(12,2) DEFAULT 0,
                gift_item VARCHAR(255),
                payment_mode VARCHAR(50) DEFAULT 'Cash',
                relation VARCHAR(100) DEFAULT 'Guest',
                payment_method_id VARCHAR(100) REFERENCES function_payment_methods(id) ON DELETE SET NULL,
                entry_source VARCHAR(30) DEFAULT 'manual',
                transaction_reference VARCHAR(255),
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 10. Add missing columns safely if moi_entries already existed
        await pool.query(`
            ALTER TABLE moi_entries ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR(100) REFERENCES function_payment_methods(id) ON DELETE SET NULL;
        `);
        await pool.query(`
            ALTER TABLE moi_entries ADD COLUMN IF NOT EXISTS entry_source VARCHAR(30) DEFAULT 'manual';
        `);
        await pool.query(`
            ALTER TABLE moi_entries ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255);
        `);

        // 11. Create required indexes safely
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_functions_account_id ON functions(account_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_moi_entries_function_id ON moi_entries(function_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_moi_entries_payment_method ON moi_entries(payment_method_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_moi_entries_entry_date ON moi_entries(created_at);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_function_payment_methods_function_id ON function_payment_methods(function_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);`);

        // Create subscription & payment indexes safely if those tables exist
        await pool.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
                    CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id ON subscriptions(account_id);
                END IF;
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
                    CREATE INDEX IF NOT EXISTS idx_payments_account_id ON payments(account_id);
                    CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
                END IF;
            END $$;
        `);

        console.log("✅ PostgreSQL 'function_payment_methods' & 'moi_entries' tables and indexes ready");
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