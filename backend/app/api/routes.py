from app.services.stock_search import StockSearchService
from fastapi import APIRouter, HTTPException
from app.services.market_data import MarketDataService
from app.services.analysis_engine import AnalysisEngine
from app.services.paper_trader import PaperTrader
from app.services.bot_engine import BotEngine
from datetime import timezone

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
def get_candles(ticker: str, period: str = "6mo", interval: str = "1d"):
    try:
        history = market.get_price_history(ticker, period=period, interval=interval)

        candles = []
        for date, row in history.iterrows():
            if interval in ["1d", "1wk", "1mo"]:
                 candle_time = date.strftime("%Y-%m-%d")
            else:
                  candle_time = int(date.timestamp())
            candles.append({
                "time": candle_time,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
            })

        return {
            "ticker": ticker.upper(),
            "period": period,
            "interval": interval,
            "candles": candles
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
        "results": search_service.search(q)
    }

@router.get("/orion-ai/{ticker}")
def get_orion_ai_analysis(ticker: str):
    ticker = ticker.upper()

    try:
        quote = market.get_quote(ticker)
        news = market.get_news(ticker)
    except Exception as exc:
        print("ORION AI ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail=str(exc))

    change_percent = quote.get("changePercent") or 0
    volume = quote.get("volume") or 0

    reasons = []
    risks = []
    confidence = 55
    outlook = "Neutral"

    if change_percent > 1:
        reasons.append("Positive price momentum today")
        confidence += 12
    elif change_percent < -1:
        risks.append("Negative price movement today")
        confidence += 8
        outlook = "Bearish"
    else:
        reasons.append("Price action is relatively stable")

    if volume:
        reasons.append("Market activity is visible through current volume")

    news_items = news.get("news", []) if isinstance(news, dict) else news
    headlines = [item.get("title", "") for item in news_items[:5]]
    
    positive_words = ["beat", "growth", "upgrade", "strong", "surge", "record", "profit"]
    negative_words = ["miss", "drop", "downgrade", "weak", "fall", "lawsuit", "risk"]

    positive_hits = sum(
        1 for headline in headlines for word in positive_words if word in headline.lower()
    )
    negative_hits = sum(
        1 for headline in headlines for word in negative_words if word in headline.lower()
    )

    if positive_hits > negative_hits:
        reasons.append("Recent headlines appear mostly positive")
        confidence += 10
        outlook = "Bullish"
    elif negative_hits > positive_hits:
        risks.append("Recent headlines contain negative signals")
        confidence += 10
        outlook = "Bearish"
    else:
        reasons.append("Recent news sentiment appears mixed or neutral")

    if change_percent > 0 and outlook != "Bearish":
        outlook = "Bullish"

    if not risks:
        risks.append("Market conditions can change quickly")
    risks.append("This is not financial advice")

    confidence = max(40, min(confidence, 90))

    summary = (
        f"Orion AI sees {ticker} as {outlook.lower()} right now. "
        f"The view is based on current price movement, volume, and recent news headlines."
    )

    return {
        "symbol": ticker,
        "outlook": outlook,
        "confidence": confidence,
        "summary": summary,
        "reasons": reasons[:4],
        "risks": risks[:4],
    }