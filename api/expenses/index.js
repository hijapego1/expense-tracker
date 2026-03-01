// Expense Tracker API - Connected to Supabase
// Project URL: https://mxrcmknyfmelqcnpmdab.supabase.co

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase config
const SUPABASE_URL = 'https://mxrcmknyfmelqcnpmdab.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY; // Set this in Vercel environment variables

const RECEIPTS_DIR = path.join(process.cwd(), 'receipts');

// Ensure receipts directory exists
function ensureDirs() {
    if (!fs.existsSync(RECEIPTS_DIR)) {
        fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
    }
}

// Fetch expenses from Supabase
async function fetchExpensesFromSupabase() {
    if (!SUPABASE_KEY) {
        throw new Error('SUPABASE_ANON_KEY not configured');
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/expenses?select=*&order=date.desc`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`Supabase error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Supabase format to app format
    return data.map(row => ({
        id: row.id.toString(),
        amount: row.amount,
        type: row.type,
        description: row.description || '',
        date: row.date,
        job: row.job || 'General',
        receiptFilename: row.receipt_path ? path.basename(row.receipt_path) : null,
        receiptPath: row.receipt_path,
        createdAt: row.created_at
    }));
}

// Insert expense to Supabase
async function insertExpenseToSupabase(expense) {
    if (!SUPABASE_KEY) {
        throw new Error('SUPABASE_ANON_KEY not configured');
    }
    
    const supabaseRow = {
        amount: expense.amount,
        type: expense.type,
        description: expense.description,
        date: expense.date,
        job: expense.job,
        receipt_path: expense.receiptPath,
        created_at: expense.createdAt
    };
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/expenses`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(supabaseRow)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase insert error: ${response.status} - ${error}`);
    }
    
    const [result] = await response.json();
    return {
        id: result.id.toString(),
        amount: result.amount,
        type: result.type,
        description: result.description || '',
        date: result.date,
        job: result.job || 'General',
        receiptFilename: result.receipt_path ? path.basename(result.receipt_path) : null,
        receiptPath: result.receipt_path,
        createdAt: result.created_at
    };
}

// Local JSON fallback (for testing)
const DATA_FILE = path.join(process.cwd(), 'data', 'expenses.json');

function readLocalExpenses() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
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

    // DEBUG: Check if env var exists
    const hasKey = !!process.env.SUPABASE_ANON_KEY;
    const keyPrefix = hasKey ? process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET';
    console.log(`DEBUG: SUPABASE_ANON_KEY exists=${hasKey}, prefix=${keyPrefix}`);

    if (req.method === 'GET') {
        // Fallback to local JSON if Supabase key not set
        if (!SUPABASE_KEY) {
            console.log('WARNING: SUPABASE_ANON_KEY not set, using local JSON fallback');
            const expenses = readLocalExpenses();
            return res.status(200).json(expenses);
        }
        
        // List all expenses from Supabase
        try {
            const expenses = await fetchExpensesFromSupabase();
            res.status(200).json(expenses);
        } catch (err) {
            console.error('Failed to fetch from Supabase:', err);
            // Fallback to local on error
            const expenses = readLocalExpenses();
            res.status(200).json(expenses);
        }
        return;
    }

    if (req.method === 'POST') {
        // Add new expense with optional receipt image to Supabase
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
        
        const { amount, type, description, date, job, receiptImage, receiptFilename } = body;

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
            const localReceiptPath = path.join(RECEIPTS_DIR, savedFilename);
            fs.writeFileSync(localReceiptPath, buffer);
            receiptPath = `/receipts/${savedFilename}`;
        }

        const newExpense = {
            amount: parseFloat(amount),
            type,
            description: description || '',
            date: date || new Date().toISOString().split('T')[0],
            job: job || 'General',
            receiptPath: receiptPath,
            createdAt: new Date().toISOString()
        };

        try {
            const result = await insertExpenseToSupabase(newExpense);
            res.status(201).json(result);
        } catch (err) {
            console.error('Failed to insert to Supabase:', err);
            res.status(500).json({ error: 'Failed to save expense', details: err.message });
        }
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
