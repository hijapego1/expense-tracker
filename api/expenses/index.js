import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwfekgypq',
  api_key: process.env.CLOUDINARY_API_KEY || '259778139957773',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gRJR_cqKr17zsaJAaGJPV9kZEnw'
});

// Local storage for backup
const DATA_FILE = path.join('/tmp', 'data', 'expenses.json');
const RECEIPTS_DIR = path.join('/tmp', 'receipts');

function ensureDirs() {
  if (!fs.existsSync(RECEIPTS_DIR)) {
    fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
  }
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readExpenses() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

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
    const { amount, type, description, date, job, receiptImage, receiptFilename } = body;
    
    if (!amount || !type) {
      res.status(400).json({ error: 'Amount and type are required' });
      return;
    }

    let cloudinaryUrl = null;
    let savedFilename = null;

    // Upload to Cloudinary if image provided
    if (receiptImage) {
      try {
        // Remove data URI prefix if present
        const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, '');
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${base64Data}`,
          {
            folder: 'expense-receipts',
            public_id: `receipt-${Date.now()}`,
            resource_type: 'image'
          }
        );
        
        cloudinaryUrl = result.secure_url;
        console.log('Cloudinary upload success:', cloudinaryUrl);
        
        // Also save locally as backup
        savedFilename = receiptFilename || `receipt-${Date.now()}.jpg`;
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(path.join(RECEIPTS_DIR, savedFilename), buffer);
        
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Continue without image - expense will be saved without photo
      }
    }

    const expenses = readExpenses();
    
    const newExpense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      type,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      job: job || 'General',
      receiptFilename: savedFilename,
      receiptPath: cloudinaryUrl, // Use Cloudinary URL instead of local path
      createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    writeExpenses(expenses);

    res.status(201).json(newExpense);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
