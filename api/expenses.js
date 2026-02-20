const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'expenses.json');

// Ensure data directory and file exist
function ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
}

// Read expenses
function readExpenses() {
    ensureDataFile();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Write expenses
function writeExpenses(expenses) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

module.exports = async (req, res) => {
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
        // Add new expense
        const { amount, type, description, date } = req.body;

        if (!amount || !type) {
            res.status(400).json({ error: 'Amount and type are required' });
            return;
        }

        const expenses = readExpenses();
        const newExpense = {
            id: Date.now().toString(),
            amount: parseFloat(amount),
            type,
            description: description || '',
            date: date || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };

        expenses.push(newExpense);
        writeExpenses(expenses);

        res.status(201).json(newExpense);
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
};
