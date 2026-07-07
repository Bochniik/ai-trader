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

    def get_price_history(self, ticker: str, period: str = "6mo", interval: str = "1d"):
        clean_ticker = ticker.strip().upper()
        if not clean_ticker:
            raise ValueError("Ticker is required")

        allowed_periods = {"1d", "5d", "1mo", "3mo", "6mo", "ytd", "1y", "2y", "5y"}
        allowed_intervals = {"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo"}

        if period not in allowed_periods:
            raise ValueError(f"Unsupported chart period: {period}")

        if interval not in allowed_intervals:
            raise ValueError(f"Unsupported chart interval: {interval}")

        stock = yf.Ticker(clean_ticker)
        history = stock.history(period=period, interval=interval)

        if history.empty:
            raise ValueError(f"No price history found for {clean_ticker}")

        return history
    def get_news(self, ticker: str, limit: int = 8):
        clean_ticker = ticker.strip().upper()
        if not clean_ticker:
            raise ValueError("Ticker is required")

        stock = yf.Ticker(clean_ticker)
        raw_news = stock.news or []
        articles = []

        for item in raw_news[:limit]:
            content = item.get("content", item) if isinstance(item, dict) else {}
            title = content.get("title") or item.get("title")
            link = content.get("canonicalUrl", {}).get("url") or content.get("clickThroughUrl", {}).get("url") or item.get("link")
            publisher = content.get("provider", {}).get("displayName") or item.get("publisher")
            published_at = content.get("pubDate") or item.get("providerPublishTime")

            if isinstance(published_at, str):
                try:
                    published_at = int(datetime.fromisoformat(published_at.replace("Z", "+00:00")).timestamp())
                except ValueError:
                    published_at = None

            if title and link:
                articles.append({
                    "title": title,
                    "publisher": publisher,
                    "link": link,
                    "published_at": published_at,
                })

        return {
            "ticker": clean_ticker,
            "news": articles,
        }

