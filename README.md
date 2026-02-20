# Expense Tracker for Sum

## What It Does

Tracks company expenses from receipt photos:
- You send receipt photos via Telegram
- I extract: expense type + amount
- Stores data automatically
- Weekly/monthly summaries

## Expense Types

- Dining (餐飲)
- Travel (交通)
- Parking (停車)
- Equipment (設備)
- Supplies (文具/用品)
- Other (其他)

## How to Use

1. **Photo receipt** with phone
2. **Send to me on Telegram** (with caption like "dinner with client")
3. **I'll extract**: amount + category + date
4. **View expenses**: Open the app URL
5. **Export**: Download as CSV for Excel

## Tech Stack

- Frontend: HTML + JavaScript
- Backend: Node.js/Express
- Storage: JSON files
- Deployment: Vercel

## Files

- `index.html` - View expenses
- `api/add.js` - Add expense API
- `api/list.js` - List expenses API
- `data/expenses.json` - Storage

---

*Built by hijapego for Sum | 2026-02-20*
