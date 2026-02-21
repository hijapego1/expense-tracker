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

  // Helper to get expenses from Upstash
  async function getExpenses() {
    try {
      const response = await fetch(`${UPSTASH_URL}/get/expenses`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      });
      const data = await response.json();
      
      // Upstash returns {result: "json-string"} or {value: "json-string"}
      let raw = null;
      if (data.result !== undefined) raw = data.result;
      else if (data.value !== undefined) raw = data.value;
      
      if (!raw) return [];
      
      // Parse the JSON string
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.log('Get error:', err.message);
      return [];
    }
  }

  // Helper to save expenses to Upstash
  async function saveExpenses(expenses) {
    await fetch(`${UPSTASH_URL}/set/expenses`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: JSON.stringify(expenses) })
    });
  }

  if (req.method === 'GET') {
    const expenses = await getExpenses();
    return res.status(200).json(expenses);
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const { amount, type, description, date, job, receiptFilename, receiptPath } = body;
      
      if (!amount || !type) {
        return res.status(400).json({ error: 'Amount and type required' });
      }

      // Get existing expenses
      const expenses = await getExpenses();
      
      // Add new expense
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

      // Save back to database
      await saveExpenses(expenses);

      return res.status(201).json(newExpense);
      
    } catch (err) {
      console.error('POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
