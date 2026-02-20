import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local storage paths
const DATA_FILE = path.join(process.cwd(), 'data', 'expenses.json');
const RECEIPTS_DIR = path.join(process.cwd(), 'receipts');

// Ensure directories exist
function ensureDirs() {
    if (!fs.existsSync(RECEIPTS_DIR)) {
        fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
    }
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Read expenses
function readExpenses() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Write expenses
function writeExpenses(expenses) {
    ensureDirs();
    fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        // List all expenses
        const expenses = readExpenses();
        res.status(200).json(expenses);
        return;
    }

    if (req.method === 'POST') {
        // Add new expense with optional receipt image
        ensureDirs();
        
        let body = req.body;
        
        // Handle both JSON and string body
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                res.status(400).json({ error: 'Invalid JSON body' });
                return;
            }
        }
        
        const { amount, type, description, date, receiptImage, receiptFilename } = body;

        if (!amount || !type) {
            res.status(400).json({ error: 'Amount and type are required' });
            return;
        }

        // Save receipt image if provided
        let receiptPath = null;
        let savedFilename = null;
        if (receiptImage) {
            // receiptImage is base64 data
            const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            savedFilename = receiptFilename || `receipt-${Date.now()}.jpg`;
            receiptPath = path.join(RECEIPTS_DIR, savedFilename);
            fs.writeFileSync(receiptPath, buffer);
        }

        const expenses = readExpenses();
        const newExpense = {
            id: Date.now().toString(),
            amount: parseFloat(amount),
            type,
            description: description || '',
            date: date || new Date().toISOString().split('T')[0],
            receiptFilename: savedFilename,
            receiptPath: receiptPath ? `/receipts/${savedFilename}` : null,
            createdAt: new Date().toISOString()
        };

        expenses.push(newExpense);
        writeExpenses(expenses);

        res.status(201).json(newExpense);
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
