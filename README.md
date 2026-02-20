# Expense Tracker v1.03 for Sum

## What It Does

Tracks company expenses from receipt photos with **job/project tracking** and **month view**:
- You send receipt photos via Telegram
- Add **job/project name** in caption (e.g., "Steph Song project") or leave blank for General
- **Quick confirm:** Reply **Y** to save, **N** to cancel
- **View by any month** - check past months like November 2025
- Export to CSV for Excel

## Expense Types

- Dining (餐飲)
- Travel (交通)
- Parking (停車)
- Equipment (設備)
- Supplies (文具/用品)
- Other (其他)

## How to Use

### Sending Receipts

**With Job/Project:**
1. Photo receipt
2. **Add caption:** "Steph Song project" (or any job name)
3. Send to hijapego on Telegram
4. I ask: "Save? (Y/N)"
5. Reply **Y** → Saved with job tag

**Without Job (General):**
1. Photo receipt
2. Send without caption (or just "receipt")
3. I ask: "Save? (Y/N)"
4. Reply **Y** → Saved as General expense

### Quick Commands

- **Y** = Yes, save it
- **N** = No, cancel/amend

### Viewing by Month

- **Web app:** https://expense-tracker-fndu.vercel.app/
- **Month selector:** Choose any month (e.g., 2025年11月)
- **View past months:** Check November 2025, December 2025, etc.
- **All Time:** See all expenses

### By Job

- Expenses grouped by project name
- Filter and export by job

## v1.03 Features

- ✅ **Quick confirm:** Y/N (no typing "yes")
- ✅ **Job/Project tracking:** Caption = job name
- ✅ **Month view:** Select any month to view past expenses
- ✅ **Keep Chinese names:** Merchant names stay in original language
- ✅ **Simple descriptions:** Just merchant name, no item details
- ✅ **Local receipt storage:** Photos saved on Mac Mini
- ✅ **Receipt image display:** View photos in web app
- ✅ **Job grouping:** See expenses by project
- ✅ **CSV Export** with job column

## Storage Location

Receipts are stored locally at:
```
/Users/hijapego/.openclaw/workspace/expense-tracker/receipts/
```

Data is stored at:
```
/Users/hijapego/.openclaw/workspace/expense-tracker/data/expenses.json
```

## Example Workflows

**Job Expense:**
- Caption: "Steph Song project"
- Amount: $150
- Type: Dining
- Result: Tagged with "Steph Song project"

**General Expense:**
- Caption: (none)
- Amount: $50
- Type: Parking
- Result: Tagged as "General"

**View Past Month:**
- Select "2025年11月" from dropdown
- See November 2025 expenses
- Check totals for that month

## Tech Stack

- Frontend: HTML + JavaScript
- Backend: Node.js (Serverless)
- Storage: Local filesystem (Mac Mini)
- Deployment: Vercel

## Files

- `index.html` - View expenses + month selector + receipt photos + job grouping
- `api/expenses/` - Add/list expenses with job field
- `api/archive/` - View receipt archives
- `api/receipts/` - Serve receipt images
- `receipts/` - Stored receipt images
- `data/` - Expense data (JSON)

---

*Built by hijapego for Sum | 2026-02-21 | v1.03*
