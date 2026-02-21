import fs from 'fs';
import path from 'path';

// Use /tmp for Vercel serverless (only writable location)
const DATA_FILE = path.join('/tmp', 'data', 'expenses.json');
const RECEIPTS_DIR = path.join('/tmp', 'receipts');

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
    const expenses = readExpenses();
    res.status(200).json(expenses);
    return;
  }

  if (req.method === 'POST') {
    ensureDirs();
    
    const body = req.body;
    const { amount, type, description, date, job, receiptFilename } = body;
    
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
      job: job || 'General',
      receiptFilename: receiptFilename || null,
      createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    writeExpenses(expenses);

    res.status(201).json(newExpense);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
