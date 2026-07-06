STOCKS = [
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "Technology"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology"},
    {"ticker": "TSLA", "name": "Tesla Inc.", "sector": "Consumer Cyclical"},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Cyclical"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "Communication Services"},
    {"ticker": "META", "name": "Meta Platforms Inc.", "sector": "Communication Services"},
    {"ticker": "AMD", "name": "Advanced Micro Devices Inc.", "sector": "Technology"},
    {"ticker": "NFLX", "name": "Netflix Inc.", "sector": "Communication Services"},
    {"ticker": "PLTR", "name": "Palantir Technologies Inc.", "sector": "Technology"},
    {"ticker": "MSTR", "name": "MicroStrategy Inc.", "sector": "Technology"},
    {"ticker": "MU", "name": "Micron Technology Inc.", "sector": "Technology"},
    {"ticker": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financial Services"},
    {"ticker": "V", "name": "Visa Inc.", "sector": "Financial Services"},
    {"ticker": "MA", "name": "Mastercard Inc.", "sector": "Financial Services"},
]


class StockSearchService:
    def search(self, query: str):
        query = query.lower().strip()

        if not query:
            return []

        results = []

        for stock in STOCKS:
            ticker_match = query in stock["ticker"].lower()
            name_match = query in stock["name"].lower()
            sector_match = query in stock["sector"].lower()

            if ticker_match or name_match or sector_match:
                results.append(stock)

        return results[:8]