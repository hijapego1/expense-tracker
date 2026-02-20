# Receipt Processing for Expense Tracker

## What It Does

When Sum sends receipt photos via Telegram:
1. Extract text/numbers from receipt image
2. Identify the total amount
3. Guess expense type based on context
4. Ask Sum to confirm
5. Save to expense tracker app

## API Endpoint

**POST** `https://expense-tracker-fndu.vercel.app/api/expenses`

**Body:**
```json
{
  "amount": 123.50,
  "type": "dining",
  "description": "Lunch meeting",
  "date": "2026-02-20"
}
```

## Expense Types

- **dining** - 餐飲 (restaurants, food, drinks)
- **travel** - 交通 (taxi, MTR, bus, fuel)
- **parking** - 停車 (car park fees)
- **equipment** - 設備 (gear, instruments, tech)
- **supplies** - 用品 (stationery, office supplies)
- **other** - 其他 (catch-all)

## How to Detect Amount

Look for:
- "Total" / "總計" / "合計"
- Largest number on receipt
- Numbers with $ or HK$ prefix
- Final amount after taxes/discounts

## How to Detect Type

From receipt text:
- Restaurant names → **dining**
- "Parking" / 停車場 → **parking**
- MTR, taxi, Uber → **travel**
- Music stores, Apple, electronics → **equipment**
- Stationery stores → **supplies**

From user caption:
- "lunch", "dinner", "client meal" → **dining**
- "client meeting", "rehearsal" → context dependent

## Workflow

1. Receive photo + caption from Sum
2. Analyze image (extract text if possible, or ask Sum to tell me the amount)
3. Guess type from context
4. Ask: "Dining $150 for lunch meeting. Save?"
5. If yes → POST to API
6. Confirm: "Saved! View at https://expense-tracker-fndu.vercel.app/"

---

*Created: 2026-02-20*
