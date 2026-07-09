from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.stock_search import StockSearchService
from app.services.market_data import MarketDataService
from app.services.analysis_engine import AnalysisEngine
from app.services.paper_trader import PaperTrader
from app.services.bot_engine import BotEngine
from app.services.watchlist import Watchlist
from app.services.orion_ai_service import (
    analyze_with_llm,
    ask_orion,
    compare_stocks,
    rank_watchlist,
    review_portfolio,
)

router = APIRouter()


class OrionChatRequest(BaseModel):
    ticker: str
    question: str
    history: list[dict] = []


class OrionWatchlistRequest(BaseModel):
    tickers: list[str]


class OrionCompareRequest(BaseModel):
    primary: str
    secondary: str
    question: str = ""


market = MarketDataService()
analysis = AnalysisEngine()
search_service = StockSearchService()
paper = PaperTrader(starting_cash=10000)
bot = BotEngine(market=market, analysis=analysis, trader=paper)
watchlist = Watchlist()


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
            "portfolio": paper.portfolio(),
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
            "portfolio": paper.portfolio(),
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
def get_candles(ticker: str, period: str = "6mo", interval: str = "1d"):
    try:
        history = market.get_price_history(
            ticker,
            period=period,
            interval=interval,
        )

        candles = []

        for date, row in history.iterrows():
            if interval in ["1d", "1wk", "1mo"]:
                candle_time = date.strftime("%Y-%m-%d")
            else:
                candle_time = int(date.timestamp())

            candles.append(
                {
                    "time": candle_time,
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                }
            )

        return {
            "ticker": ticker.upper(),
            "period": period,
            "interval": interval,
            "candles": candles,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/news/{ticker}")
def get_news(ticker: str):
    try:
        return market.get_news(ticker)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search")
def search_stocks(q: str):
    return {
        "query": q,
        "results": search_service.search(q),
    }


def build_orion_context(ticker: str):
    ticker = ticker.upper()

    quote = market.get_quote(ticker)
    news_response = market.get_news(ticker)
    history = market.get_price_history(ticker)
    technical_analysis = analysis.analyze(ticker, history)

    news_items = (
        news_response.get("news", [])
        if isinstance(news_response, dict)
        else news_response
    )

    return {
        "ticker": ticker,
        "quote": quote,
        "technical_analysis": technical_analysis,
        "recent_news": news_items[:6],
    }


@router.get("/orion-ai/{ticker}")
def get_orion_ai_analysis(ticker: str):
    ticker = ticker.upper()

    try:
        context = build_orion_context(ticker)
    except Exception as exc:
        print("ORION AI DATA ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        return analyze_with_llm(
            ticker,
            context["quote"],
            context["technical_analysis"],
            context["recent_news"],
        )
    except Exception as exc:
        print("ORION LLM ERROR:", repr(exc))

        return {
            "symbol": ticker,
            "outlook": "Neutral",
            "confidence": 50,
            "summary": "Orion AI could not reach the language model, so this fallback response is based on available app data only.",
            "reasons": [
                "Live quote data is available",
                "Technical analysis is available",
                "Recent news headlines are available",
            ],
            "risks": [
                "LLM analysis is currently unavailable",
                "This is not financial advice",
            ],
        }


@router.post("/orion-ai/chat")
def chat_with_orion(request: OrionChatRequest):
    ticker = request.ticker.upper()

    try:
        context = build_orion_context(ticker)

        return ask_orion(
            ticker=ticker,
            quote=context["quote"],
            analysis=context["technical_analysis"],
            news_items=context["recent_news"],
            question=request.question,
            history=request.history,
            portfolio=paper.portfolio(),
        )
    except Exception as exc:
        print("ORION CHAT ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/orion-ai/compare")
def compare_with_orion(request: OrionCompareRequest):
    primary = request.primary.upper()
    secondary = request.secondary.upper()

    try:
        primary_context = build_orion_context(primary)
        secondary_context = build_orion_context(secondary)

        question = (
            request.question
            or f"Compare {primary} and {secondary}. Which setup looks stronger today?"
        )

        return compare_stocks(
            primary_symbol=primary,
            secondary_symbol=secondary,
            primary_context=primary_context,
            secondary_context=secondary_context,
            question=question,
        )
    except Exception as exc:
        print("ORION COMPARE ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/watchlist")
def get_watchlist():
    return {
        "tickers": watchlist.get(),
    }


@router.post("/watchlist/{ticker}")
def add_watchlist(ticker: str):
    return {
        "tickers": watchlist.add(ticker),
    }


@router.delete("/watchlist/{ticker}")
def remove_watchlist(ticker: str):
    return {
        "tickers": watchlist.remove(ticker),
    }


@router.post("/orion-ai/watchlist")
def rank_watchlist_with_orion(request: OrionWatchlistRequest):
    tickers = [ticker.upper() for ticker in request.tickers if ticker.strip()]

    try:
        contexts = [build_orion_context(ticker) for ticker in tickers]

        return rank_watchlist(
            tickers=tickers,
            contexts=contexts,
        )
    except Exception as exc:
        print("ORION WATCHLIST ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/orion-ai/portfolio-review")
def review_portfolio_with_orion():
    try:
        return review_portfolio(paper.portfolio())
    except Exception as exc:
        print("ORION PORTFOLIO REVIEW ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail=str(exc))