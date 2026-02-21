export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const UPSTASH_URL = process.env.KV_REST_API_URL;
  const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN;

  if (req.method === 'GET') {
    try {
      const response = await fetch(`${UPSTASH_URL}/get/expenses`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      });
      
      const data = await response.json();
      
      // Handle both result and value formats
      let expenses = [];
      if (data.result) {
        expenses = JSON.parse(data.result);
      } else if (data.value) {
        expenses = JSON.parse(data.value);
      }
      
      return res.status(200).json(expenses);
      
    } catch (err) {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const { amount, type, description, date, job, receiptFilename, receiptPath } = body;
      
      if (!amount || !type) {
        return res.status(400).json({ error: 'Amount and type required' });
      }

      // Get existing
      const getRes = await fetch(`${UPSTASH_URL}/get/expenses`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      });
      const getData = await getRes.json();
      
      let expenses = [];
      if (getData.result) {
        expenses = JSON.parse(getData.result);
      } else if (getData.value) {
        expenses = JSON.parse(getData.value);
      }

      // Add new
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

      // Save back
      await fetch(`${UPSTASH_URL}/set/expenses`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: JSON.stringify(expenses) })
      });

      return res.status(201).json(newExpense);
      
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
