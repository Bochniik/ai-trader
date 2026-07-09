class Watchlist:
    def __init__(self):
        self._tickers = [
            "AAPL",
            "MSFT",
            "NVDA",
            "AMD",
            "GOOGL",
        ]

    def get(self):
        return self._tickers

    def add(self, ticker):
        ticker = ticker.upper()

        if ticker not in self._tickers:
            self._tickers.append(ticker)

        return self._tickers

    def remove(self, ticker):
        ticker = ticker.upper()

        self._tickers = [
            t for t in self._tickers
            if t != ticker
        ]

        return self._tickers