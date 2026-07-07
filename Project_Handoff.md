# Orion Trader - Project Handoff

## Project

Orion Trader is an AI-assisted paper trading platform built with FastAPI and React.

The goal is to create a professional desktop/web trading application capable of:

- AI stock analysis
- Paper trading
- Portfolio management
- AI trading bot
- Live market data
- Financial news
- Backtesting
- Eventually live broker integration

---

# Tech Stack

Backend
- FastAPI
- yfinance
- pandas
- numpy

Frontend
- React
- Vite
- lightweight-charts
- Lucide React

Version Control
- Git
- GitHub

---

# Current Project Structure

backend/
frontend/

frontend/src/components

- SearchPanel.jsx
- CandleChart.jsx
- Watchlist.jsx
- PortfolioPanel.jsx
- AnalysisPanel.jsx
- BotPanel.jsx
- SignalBadge.jsx

frontend/src/api

- api.js

---

# Current Features

✅ Stock Analysis

✅ Candlestick Charts

✅ Paper Trading

✅ Portfolio

✅ Watchlist

✅ AI Bot

✅ Search Autocomplete

✅ Component Based Architecture

---

# Git Workflow

Always develop locally in VS Code.

Never use ZIP files.

Workflow:

git add .
git commit -m "..."
git push

GitHub is the single source of truth.

---

# Coding Style

- Keep components small.
- API calls belong in api.js.
- One feature per commit.
- Test after every feature.
- Keep main.jsx lightweight.

---

# Next Priority

Replace hardcoded stock search with live Yahoo Finance search.

After that:

- Live prices
- Financial news
- AI news sentiment
- Backtesting
- Portfolio analytics
