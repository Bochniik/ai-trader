import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
print("OPENAI KEY LOADED:", bool(api_key))

client = OpenAI(api_key=api_key)

SYSTEM_INSTRUCTIONS = """
You are Orion AI, an assistant inside Orion Trader.

You analyze stocks using:
- current quote data
- price movement
- volume
- technical analysis
- recent news headlines

You are not a financial advisor.
Never guarantee profits.
Always mention risk.
Return practical, clear trading-style analysis.
Keep the tone professional and concise.
"""


def build_context(ticker, quote, analysis, news_items):
    headlines = [
        {
            "title": item.get("title", ""),
            "publisher": item.get("publisher", ""),
            "published": item.get("published", ""),
        }
        for item in news_items[:6]
    ]

    return {
        "ticker": ticker,
        "quote": quote,
        "technical_analysis": analysis,
        "recent_news": headlines,
    }


def analyze_with_llm(ticker, quote, analysis, news_items):
    context = build_context(ticker, quote, analysis, news_items)

    try:
        response = client.responses.create(
            model="gpt-5.5",
            instructions=SYSTEM_INSTRUCTIONS,
            input=f"""
Analyze this stock for a paper trading dashboard.

Return JSON only with this structure:
{{
  "symbol": "{ticker}",
  "outlook": "Bullish | Neutral | Bearish",
  "confidence": 0-100,
  "summary": "short paragraph",
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "risks": ["risk 1", "risk 2"]
}}

Stock context:
{json.dumps(context, indent=2)}
""",
        )

    except Exception as e:
        print("OPENAI ERROR:", repr(e))
        raise

    try:
        return json.loads(response.output_text)

    except json.JSONDecodeError:
        return {
            "symbol": ticker,
            "outlook": "Neutral",
            "confidence": 50,
            "summary": response.output_text,
            "reasons": ["The AI returned an unstructured response."],
            "risks": ["AI output should be reviewed before making decisions."],
        }

def ask_orion(ticker, quote, analysis, news_items, question, history=None, portfolio=None):
    context = build_context(ticker, quote, analysis, news_items)
    history = history or []
    portfolio = portfolio or {}

    try:
        response = client.responses.create(
            model="gpt-5.5",
            instructions=SYSTEM_INSTRUCTIONS,
            input=f"""
You are answering a user question inside Orion Trader.

Previous conversation:
{json.dumps(history[-6:], indent=2)}

Portfolio context:
{json.dumps(portfolio, indent=2)}

User question:
{question}

Stock context:
{json.dumps(context, indent=2)}

Answer clearly and practically.
If the user asks to compare two stocks, compare them clearly across technicals, price momentum, volume, news, risk, and which setup looks stronger.
Do not guarantee profits.
Mention risk where relevant.
""",
        )
    except Exception as e:
        print("OPENAI CHAT ERROR:", repr(e))
        raise

    return {
        "symbol": ticker,
        "question": question,
        "answer": response.output_text,
    }

def compare_stocks(primary_symbol, secondary_symbol, primary_context, secondary_context, question):
    response = client.responses.create(
        model="gpt-5.5",
        instructions=SYSTEM_INSTRUCTIONS,
        input=f"""
You are comparing two stocks inside Orion Trader.

User question:
{question}

Primary stock:
{json.dumps(primary_context, indent=2)}

Secondary stock:
{json.dumps(secondary_context, indent=2)}

Compare them across:
- price momentum
- technical indicators
- volume
- recent news
- risk
- which setup looks stronger

Do not guarantee profits.
Mention risk.
Return a clear practical answer.
""",
    )

    return {
        "primary": primary_symbol,
        "secondary": secondary_symbol,
        "question": question,
        "answer": response.output_text,
    }

def rank_watchlist(tickers, contexts, question=None):
    response = client.responses.create(
        model="gpt-5.5",
        instructions=SYSTEM_INSTRUCTIONS,
        input=f"""
You are Orion AI inside Orion Trader.

Rank the user's watchlist from strongest to weakest setup today.

Use:
- quote data
- technical indicators
- volume
- recent news
- risk

User question:
{question or "Which stock in my watchlist looks strongest today?"}

Watchlist contexts:
{json.dumps(contexts, indent=2)}

Return a clear ranked list with:
- rank
- ticker
- short reasoning
- main risk
- best overall opportunity

Do not guarantee profits.
Mention risk.
""",
    )

    return {
        "tickers": tickers,
        "answer": response.output_text,
    }

def review_portfolio(portfolio, question=None):
    response = client.responses.create(
        model="gpt-5.5",
        instructions=SYSTEM_INSTRUCTIONS,
        input=f"""
You are Orion AI inside Orion Trader.

Review the user's paper trading portfolio.

User question:
{question or "Review my portfolio risk."}

Portfolio:
{json.dumps(portfolio, indent=2)}

Analyze:
- cash level
- open positions
- concentration risk
- trade activity
- possible weaknesses
- practical next steps

Do not guarantee profits.
Mention risk.
Give clear, practical feedback.
""",
    )

    return {
        "question": question or "Review my portfolio risk.",
        "answer": response.output_text,
    }