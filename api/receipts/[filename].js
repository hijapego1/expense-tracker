import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECEIPTS_DIR = path.join(process.cwd(), 'receipts');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        // Get filename from URL
        const url = new URL(req.url, `http://${req.headers.host}`);
        const filename = url.pathname.split('/').pop();
        
        if (!filename) {
            res.status(400).json({ error: 'Filename required' });
            return;
        }
        
        // Security: prevent directory traversal
        if (filename.includes('..') || filename.includes('/')) {
            res.status(400).json({ error: 'Invalid filename' });
            return;
        }
        
        const filePath = path.join(RECEIPTS_DIR, filename);
        
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'Receipt not found' });
            return;
        }
        
        // Read and serve the image
        const imageBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        
        res.setHeader('Content-Type', contentType);
        res.status(200).send(imageBuffer);
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
