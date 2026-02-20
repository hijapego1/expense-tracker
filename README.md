# Expense Tracker v1.01 for Sum

## What It Does

Tracks company expenses from receipt photos with **local storage**:
- You send receipt photos via Telegram
- I **store the photo locally** on your Mac Mini + extract data
- View expenses and receipt photos in the web app
- Organize by date for tax records
- Export to CSV for Excel

**Future v2.0:** A4 PDF generation for printing/filing

## Expense Types

- Dining (餐飲)
- Travel (交通)
- Parking (停車)
- Equipment (設備)
- Supplies (文具/用品)
- Other (其他)

## How to Use

1. **Photo receipt** with phone
2. **Send to me on Telegram** (say "save this receipt")
3. **I store**: Photo locally + extract data from receipt
4. **View**: Open the app URL to see expenses + receipt photos
5. **Export**: Download CSV for Excel
6. **Future**: Generate A4 PDF pages (v2.0)

## v1.01 Features

- ✅ **Local receipt storage** - Photos saved on your Mac Mini
- ✅ **Receipt image display** - View photos in web app
- ✅ **Date organization** - Sort by date for tax records
- ✅ **CSV Export** - Excel compatible

## Storage Location

Receipts are stored locally at:
```
/Users/hijapego/.openclaw/workspace/expense-tracker/receipts/
```

Data is stored at:
```
/Users/hijapego/.openclaw/workspace/expense-tracker/data/expenses.json
```

## Tech Stack

- Frontend: HTML + JavaScript
- Backend: Node.js (Serverless)
- Storage: Local filesystem (Mac Mini)
- Deployment: Vercel (frontend only, data stays local)

## Files

- `index.html` - View expenses + receipt photos
- `api/expenses/` - Add/list expenses
- `api/archive/` - View receipt archives
- `api/receipts/` - Serve receipt images
- `receipts/` - Stored receipt images
- `data/` - Expense data (JSON)

---

*Built by hijapego for Sum | 2026-02-20 | v1.01*
