import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');
const dbFile = path.join(dataDir, 'store.json');

// Initial seed data
const initialData = {
    users: [
        {
            id: 'u_demo_1',
            name: 'Demo Family Admin',
            email: 'demo@vizhabook.com',
            phone: '9876543210',
            countryCode: '+91',
            password: 'demo1234',
            createdAt: new Date().toISOString()
        }
    ],
    functions: [
        {
            id: 'f_1',
            userId: 'u_demo_1',
            title: 'Karthik & Janani Marriage',
            type: 'Wedding',
            date: '2026-09-15',
            venue: 'Sri Raja Rajeswari Hall, Chennai',
            budget: 500000,
            status: 'Active'
        },
        {
            id: 'f_2',
            userId: 'u_demo_1',
            title: 'Ananya Ear Piercing Ceremony',
            type: 'Ear Piercing',
            date: '2026-10-04',
            venue: 'Muralis Hall, Madurai',
            budget: 150000,
            status: 'Upcoming'
        }
    ],
    moiEntries: [
        {
            id: 'm_1',
            functionId: 'f_1',
            userId: 'u_demo_1',
            guestName: 'K. Senthil Nathan',
            villageCity: 'Chennai',
            phone: '9876543211',
            amount: 5001,
            giftItem: 'Silk Saree & Cash',
            paymentMode: 'Cash',
            relation: 'Uncle',
            whatsappSent: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'm_2',
            functionId: 'f_1',
            userId: 'u_demo_1',
            guestName: 'Dr. Meenakshi & Family',
            villageCity: 'Coimbatore',
            phone: '9876543212',
            amount: 10001,
            giftItem: '1 Sovereign Gold Coin',
            paymentMode: 'UPI',
            relation: 'Family Friend',
            whatsappSent: true,
            createdAt: new Date().toISOString()
        }
    ],
    expenses: [
        {
            id: 'e_1',
            functionId: 'f_1',
            userId: 'u_demo_1',
            category: 'Catering & Meals',
            vendor: 'Vasantha Bhavan Caterers',
            amount: 180000,
            paidAmount: 100000,
            status: 'Partial',
            date: '2026-08-01'
        },
        {
            id: 'e_2',
            functionId: 'f_1',
            userId: 'u_demo_1',
            category: 'Hall Rental',
            vendor: 'Raja Rajeswari Mandapam',
            amount: 120000,
            paidAmount: 120000,
            status: 'Paid',
            date: '2026-07-20'
        }
    ],
    approvals: []
};

// Ensure directory and db file exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf-8');
}

export const readDB = () => {
    try {
        const raw = fs.readFileSync(dbFile, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error reading database file:', err);
        return initialData;
    }
};

export const writeDB = (data) => {
    try {
        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error writing database file:', err);
    }
};
