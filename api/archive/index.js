import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(process.cwd(), 'data', 'expenses.json');
const RECEIPTS_DIR = path.join(process.cwd(), 'receipts');

function readExpenses() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        // Get expenses with receipts, sorted by date
        const expenses = readExpenses()
            .filter(e => e.receiptFilename)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Group by month for A4 page organization
        const byMonth = {};
        expenses.forEach(expense => {
            const month = expense.date.substring(0, 7); // YYYY-MM
            if (!byMonth[month]) {
                byMonth[month] = [];
            }
            byMonth[month].push(expense);
        });
        
        // Get list of saved receipt files
        let receiptFiles = [];
        if (fs.existsSync(RECEIPTS_DIR)) {
            receiptFiles = fs.readdirSync(RECEIPTS_DIR);
        }
        
        res.status(200).json({
            expenses,
            byMonth,
            totalReceipts: expenses.length,
            months: Object.keys(byMonth).sort(),
            receiptFiles
        });
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
