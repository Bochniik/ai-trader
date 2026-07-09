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

def ask_orion(ticker, quote, analysis, news_items, question, history=None):
    context = build_context(ticker, quote, analysis, news_items)
    history = history or []

    try:
        response = client.responses.create(
            model="gpt-5.5",
            instructions=SYSTEM_INSTRUCTIONS,
            input=f"""
You are answering a user question inside Orion Trader.

Previous conversation:
{json.dumps(history[-6:], indent=2)}

User question:
{question}

Stock context:
{json.dumps(context, indent=2)}

Answer clearly and practically.
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