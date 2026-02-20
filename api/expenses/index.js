// Simple in-memory storage (resets on deploy, but works for demo)
const expenses = [];

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
        res.status(200).json(expenses);
        return;
    }

    if (req.method === 'POST') {
        // Add new expense
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
        
        const { amount, type, description, date } = body;

        if (!amount || !type) {
            res.status(400).json({ error: 'Amount and type are required' });
            return;
        }

        const newExpense = {
            id: Date.now().toString(),
            amount: parseFloat(amount),
            type,
            description: description || '',
            date: date || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };

        expenses.push(newExpense);

        res.status(201).json(newExpense);
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
