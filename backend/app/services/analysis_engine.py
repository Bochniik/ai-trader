import pandas as pd


class AnalysisEngine:
    def calculate_sma(self, prices: pd.Series, period: int):
        return prices.rolling(window=period).mean()

    def calculate_ema(self, prices: pd.Series, period: int):
        return prices.ewm(span=period, adjust=False).mean()

    def calculate_rsi(self, prices: pd.Series, period: int = 14) -> float:
        delta = prices.diff()

        gain = delta.where(delta > 0, 0).rolling(window=period).mean()
        loss = -delta.where(delta < 0, 0).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        return round(float(rsi.iloc[-1]), 2)

    def analyze(self, ticker: str, history):
        close = history["Close"]
        volume = history["Volume"]

        current_price = round(float(close.iloc[-1]), 2)

        rsi = self.calculate_rsi(close)
        sma_20 = round(float(self.calculate_sma(close, 20).iloc[-1]), 2)
        sma_50 = round(float(self.calculate_sma(close, 50).iloc[-1]), 2)
        ema_20 = round(float(self.calculate_ema(close, 20).iloc[-1]), 2)

        avg_volume = volume.rolling(window=20).mean().iloc[-1]
        latest_volume = volume.iloc[-1]

        score = 50
        reasons = []

        if rsi < 30:
            score += 20
            reasons.append("RSI is below 30, so the stock may be oversold.")
        elif rsi > 70:
            score -= 20
            reasons.append("RSI is above 70, so the stock may be overbought.")
        else:
            reasons.append("RSI is neutral.")

        if current_price > sma_20:
            score += 10
            reasons.append("Price is above the 20-day moving average.")
        else:
            score -= 10
            reasons.append("Price is below the 20-day moving average.")

        if sma_20 > sma_50:
            score += 15
            reasons.append("The 20-day trend is above the 50-day trend.")
        else:
            score -= 15
            reasons.append("The 20-day trend is below the 50-day trend.")

        if current_price > ema_20:
            score += 10
            reasons.append("Price is above the 20-day EMA.")
        else:
            score -= 10
            reasons.append("Price is below the 20-day EMA.")

        if latest_volume > avg_volume:
            score += 5
            reasons.append("Volume is above average.")
        else:
            reasons.append("Volume is not above average.")

        score = max(0, min(100, score))

        if score >= 70:
            signal = "BUY"
        elif score <= 30:
            signal = "SELL"
        else:
            signal = "HOLD"

        return {
            "ticker": ticker.upper(),
            "price": current_price,
            "signal": signal,
            "confidence_score": score,
            "indicators": {
                "rsi": rsi,
                "sma_20": sma_20,
                "sma_50": sma_50,
                "ema_20": ema_20,
                "latest_volume": int(latest_volume),
                "average_volume_20": int(avg_volume),
            },
            "reasons": reasons,
        }
