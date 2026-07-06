# AI Trader v0.5

This version adds a frontend watchlist.

## Added

- Watchlist section
- Add current ticker to watchlist
- Remove ticker from watchlist
- Click watchlist ticker to load analysis and chart

## Run backend

```powershell
cd ai-trader-v0.5/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## Run frontend

```powershell
cd ai-trader-v0.5/frontend
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:5173
```

Educational/paper-trading project only. Not financial advice.
