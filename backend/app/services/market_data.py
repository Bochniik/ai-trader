import yfinance as yf


class MarketDataService:
    def get_stock(self, ticker: str):
        stock = yf.Ticker(ticker)
        info = stock.fast_info

        return {
            "ticker": ticker.upper(),
            "price": info.get("lastPrice"),
            "day_high": info.get("dayHigh"),
            "day_low": info.get("dayLow"),
            "volume": info.get("lastVolume"),
        }

    def get_price_history(self, ticker: str, period: str = "6mo"):
        stock = yf.Ticker(ticker)
        history = stock.history(period=period)

        if history.empty:
            raise ValueError(f"No price history found for {ticker.upper()}")

        return history
