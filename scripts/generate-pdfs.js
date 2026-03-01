import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PDFDocument, rgb } from 'pdf-lib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECEIPTS_DIR = path.join(__dirname, '..', 'receipts');
const DATA_FILE = path.join(__dirname, '..', 'data', 'expenses.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'pdf-output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function readExpenses() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function groupByMonthAndType(expenses) {
  const groups = {};
  expenses.forEach(expense => {
    const month = expense.date.substring(0, 7);
    const type = expense.type || 'Other';
    const key = `${month}-${type}`;
    if (!groups[key]) {
      groups[key] = { month, type, expenses: [] };
    }
    groups[key].expenses.push(expense);
  });
  return groups;
}

async function createPDF(group) {
  const { month, type, expenses } = group;
  expenses.sort((a, b) => new Date(a.date) - new Date(b.date));

  const pdfDoc = await PDFDocument.create();
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  
  // Tighter layout: 3 columns x 3 rows = 9 per page
  const margin = 25;
  const gap = 10;
  const cols = 3;
  const rows = 3;
  
  const usableWidth = pageWidth - margin * 2 - gap * (cols - 1);
  const usableHeight = pageHeight - margin * 2 - 40; // 40 for title
  const cellWidth = usableWidth / cols;
  const cellHeight = usableHeight / rows;
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let receiptIndex = 0;
  
  // Title
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [year, monthNum] = month.split('-');
  const title = `${monthNames[parseInt(monthNum)-1]} ${year} - ${type.toUpperCase()}`;
  page.drawText(title, { x: margin, y: pageHeight - 30, size: 12 });
  
  let addedCount = 0;
  
  for (const expense of expenses) {
    // Find image
    let receiptPath = null;
    if (expense.receiptPath) {
      const relativePath = expense.receiptPath.replace(/^\/receipts\//, '');
      receiptPath = path.join(RECEIPTS_DIR, relativePath);
    }
    
    if (!receiptPath || !fs.existsSync(receiptPath)) {
      console.log(`  ⚠️  Missing: ${expense.description}`);
      continue;
    }
    
    try {
      // Calculate grid position
      const col = receiptIndex % cols;
      const row = Math.floor(receiptIndex / cols) % rows;
      
      // Check if need new page
      if (receiptIndex > 0 && receiptIndex % (cols * rows) === 0) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        // Add page number or continuation
        const contText = `${title} (cont.)`;
        page.drawText(contText, { x: margin, y: pageHeight - 30, size: 12 });
      }
      
      const x = margin + col * (cellWidth + gap);
      const y = pageHeight - margin - 35 - (row + 1) * (cellHeight + gap) + gap;
      
      // Load image
      const imgBuffer = fs.readFileSync(receiptPath);
      const metadata = await sharp(receiptPath).metadata();
      
      // Scale to fit cell (maintain aspect ratio, fill cell)
      const imgAspect = metadata.width / metadata.height;
      const cellAspect = cellWidth / cellHeight;
      
      let imgWidth, imgHeight;
      if (imgAspect > cellAspect) {
        // Image is wider - fit to width
        imgWidth = cellWidth;
        imgHeight = imgWidth / imgAspect;
      } else {
        // Image is taller - fit to height
        imgHeight = cellHeight;
        imgWidth = imgHeight * imgAspect;
      }
      
      // Center in cell
      const offsetX = (cellWidth - imgWidth) / 2;
      const offsetY = (cellHeight - imgHeight) / 2;
      
      // Embed and draw
      let image;
      if (receiptPath.endsWith('.png')) {
        image = await pdfDoc.embedPng(imgBuffer);
      } else {
        image = await pdfDoc.embedJpg(imgBuffer);
      }
      
      page.drawImage(image, {
        x: x + offsetX,
        y: y + offsetY,
        width: imgWidth,
        height: imgHeight
      });
      
      // Small caption at bottom of cell
      const caption = `${expense.date} $${expense.amount}`;
      page.drawText(caption, {
        x: x,
        y: y - 2,
        size: 6,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      addedCount++;
      receiptIndex++;
      console.log(`  ✅ ${expense.description}`);
      
    } catch (err) {
      console.log(`  ❌ ${expense.description}: ${err.message}`);
    }
  }
  
  // Save
  const pdfName = `expenses-${month}-${type}.pdf`;
  const pdfPath = path.join(OUTPUT_DIR, pdfName);
  fs.writeFileSync(pdfPath, await pdfDoc.save());
  
  const pages = Math.ceil(addedCount / 9);
  console.log(`\n📝 ${pdfName} (${addedCount} receipts, ${pages} page${pages > 1 ? 's' : ''})`);
}

async function main() {
  console.log('🔄 Generating PDFs (3x3 layout)...\n');
  const expenses = readExpenses();
  if (!expenses.length) {
    console.log('No expenses');
    return;
  }
  
  const groups = groupByMonthAndType(expenses);
  for (const [key, group] of Object.entries(groups)) {
    console.log(`📁 ${group.month} - ${group.type}:`);
    await createPDF(group);
  }
  
  console.log('\n✅ Done!');
  console.log(`📂 ${OUTPUT_DIR}`);
}

main().catch(console.error);
