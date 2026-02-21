import { createClient } from '@vercel/kv';

// Create KV client using environment variables
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

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
    try {
      const expenses = await kv.get('expenses') || [];
      res.status(200).json(expenses);
    } catch (err) {
      console.error('KV GET error:', err);
      res.status(500).json({ error: 'Database error', details: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const { amount, type, description, date, job, receiptFilename, receiptPath } = body;
      
      if (!amount || !type) {
        res.status(400).json({ error: 'Amount and type are required' });
        return;
      }

      const expenses = await kv.get('expenses') || [];
      
      const newExpense = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        type,
        description: description || '',
        date: date || new Date().toISOString().split('T')[0],
        job: job || 'General',
        receiptFilename: receiptFilename || null,
        receiptPath: receiptPath || null,
        createdAt: new Date().toISOString()
      };

      expenses.push(newExpense);
      await kv.set('expenses', expenses);

      res.status(201).json(newExpense);
    } catch (err) {
      console.error('KV POST error:', err);
      res.status(500).json({ error: 'Database error', details: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
