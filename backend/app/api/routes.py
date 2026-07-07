from app.services.stock_search import StockSearchService
from fastapi import APIRouter, HTTPException
from app.services.market_data import MarketDataService
from app.services.analysis_engine import AnalysisEngine
from app.services.paper_trader import PaperTrader
from app.services.bot_engine import BotEngine

router = APIRouter()

market = MarketDataService()
analysis = AnalysisEngine()
search_service = StockSearchService()
paper = PaperTrader(starting_cash=10000)
bot = BotEngine(market=market, analysis=analysis, trader=paper)


@router.get("/stock/{ticker}")
def get_stock(ticker: str):
    try:
        return market.get_stock(ticker)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/quote/{ticker}")
def get_quote(ticker: str):
    try:
        return market.get_quote(ticker)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/analyze/{ticker}")
def analyze_stock(ticker: str):
    try:
        history = market.get_price_history(ticker, period="6mo")
        return analysis.analyze(ticker, history)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/paper/buy/{ticker}")
def paper_buy(ticker: str, quantity: int = 1):
    try:
        stock = market.get_stock(ticker)
        price = stock["price"]
        if price is None:
            raise ValueError("Could not get current price")

        trade = paper.buy(ticker, float(price), quantity)

        return {
            "message": "Paper buy completed",
            "trade": trade,
            "portfolio": paper.portfolio()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/paper/sell/{ticker}")
def paper_sell(ticker: str, quantity: int = 1):
    try:
        stock = market.get_stock(ticker)
        price = stock["price"]
        if price is None:
            raise ValueError("Could not get current price")

        trade = paper.sell(ticker, float(price), quantity)

        return {
            "message": "Paper sell completed",
            "trade": trade,
            "portfolio": paper.portfolio()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/paper/portfolio")
def paper_portfolio():
    return paper.portfolio()


@router.post("/bot/run/{ticker}")
def run_bot(ticker: str, quantity: int = 1):
    try:
        return bot.run_once(ticker, quantity)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/candles/{ticker}")
def get_candles(ticker: str, period: str = "6mo"):
    try:
        history = market.get_price_history(ticker, period=period)

        candles = []
        for date, row in history.iterrows():
            candles.append({
                "time": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
            })

        return {
            "ticker": ticker.upper(),
            "period": period,
            "candles": candles
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
@router.get("/search")
def search_stocks(q: str):
    return {
        "query": q,
        "results": search_service.search(q)
    }