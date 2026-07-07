from datetime import datetime, timezone

import yfinance as yf


class MarketDataService:
    def get_stock(self, ticker: str):
        return self.get_quote(ticker)

    def get_quote(self, ticker: str):
        clean_ticker = ticker.strip().upper()
        if not clean_ticker:
            raise ValueError("Ticker is required")

        stock = yf.Ticker(clean_ticker)
        info = stock.fast_info

        price = info.get("lastPrice")
        previous_close = info.get("previousClose")
        change = None
        change_percent = None

        if price is not None and previous_close not in (None, 0):
            change = float(price) - float(previous_close)
            change_percent = (change / float(previous_close)) * 100

        return {
            "ticker": clean_ticker,
            "price": round(float(price), 2) if price is not None else None,
            "change": round(change, 2) if change is not None else None,
            "change_percent": round(change_percent, 2) if change_percent is not None else None,
            "previous_close": round(float(previous_close), 2) if previous_close is not None else None,
            "open": round(float(info.get("open")), 2) if info.get("open") is not None else None,
            "day_high": round(float(info.get("dayHigh")), 2) if info.get("dayHigh") is not None else None,
            "day_low": round(float(info.get("dayLow")), 2) if info.get("dayLow") is not None else None,
            "volume": int(info.get("lastVolume")) if info.get("lastVolume") is not None else None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def get_price_history(self, ticker: str, period: str = "6mo"):
        stock = yf.Ticker(ticker)
        history = stock.history(period=period)

        if history.empty:
            raise ValueError(f"No price history found for {ticker.upper()}")

        return history
