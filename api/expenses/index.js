import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
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
    const expenses = await redis.get('expenses') || [];
    res.status(200).json(expenses);
    return;
  }

  if (req.method === 'POST') {
    const body = req.body;
    const { amount, type, description, date, job, receiptFilename } = body;
    
    if (!amount || !type) {
      res.status(400).json({ error: 'Amount and type are required' });
      return;
    }

    const expenses = await redis.get('expenses') || [];
    
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
    await redis.set('expenses', expenses);

    res.status(201).json(newExpense);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
