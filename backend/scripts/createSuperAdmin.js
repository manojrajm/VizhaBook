import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

const createSuperAdmin = async () => {
    const adminName = process.argv[2] || 'VizhaBook Super Admin';
    const adminEmail = process.argv[3] || 'admin@vizhabook.com';
    const adminPassword = process.argv[4] || 'Admin@12345';
    const adminPhone = process.argv[5] || '9999999999';

    try {
        console.log('⚡ Initializing Super Admin Creation...');
        
        // 1. Ensure Account Record Exists
        const accountId = 'acc_superadmin';
        await pool.query(`
            INSERT INTO accounts (id, name, status, created_at, updated_at)
            VALUES ($1, 'VizhaBook Platform Admin Account', 'ACTIVE', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        `, [accountId]);

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // 3. Insert or Update User with SUPER_ADMIN Role
        const userQuery = `
            INSERT INTO users (id, name, email, phone, country_code, password, role, account_id, created_at)
            VALUES ($1, $2, LOWER($3), $4, '+91', $5, 'SUPER_ADMIN', $6, NOW())
            ON CONFLICT (email) DO UPDATE SET
                password = EXCLUDED.password,
                role = 'SUPER_ADMIN',
                name = EXCLUDED.name,
                phone = EXCLUDED.phone
            RETURNING id, name, email, role, created_at;
        `;

        const userId = `usr_admin_${Date.now()}`;
        const result = await pool.query(userQuery, [
            userId,
            adminName,
            adminEmail.toLowerCase().trim(),
            adminPhone,
            hashedPassword,
            accountId
        ]);

        const adminUser = result.rows[0];

        console.log('\n======================================================');
        console.log('✅ SUPER ADMIN ACCOUNT CREATED / UPDATED SUCCESSFULLY!');
        console.log('======================================================');
        console.log(`👤 Name     : ${adminUser.name}`);
        console.log(`📧 Email    : ${adminUser.email}`);
        console.log(`🔑 Password : ${adminPassword}`);
        console.log(`🛡️ Role     : ${adminUser.role}`);
        console.log('======================================================');
        console.log('\n👉 You can now log in at: http://localhost:5173/#/admin/login');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating Super Admin account:', error);
        process.exit(1);
    }
};

createSuperAdmin();
