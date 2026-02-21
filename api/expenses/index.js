import fs from 'fs';
import path from 'path';

// Upstash REST API directly using fetch
const UPSTASH_URL = process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  const response = await fetch(`${UPSTASH_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });
  const data = await response.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function kvSet(key, value) {
  const response = await fetch(`${UPSTASH_URL}/set/${key}`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ value: JSON.stringify(value) })
  });
  return response.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const expenses = await kvGet('expenses') || [];
      res.status(200).json(expenses);
    } catch (err) {
      console.error('Database error:', err);
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

      const expenses = await kvGet('expenses') || [];
      
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
      await kvSet('expenses', expenses);

      res.status(201).json(newExpense);
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error', details: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
