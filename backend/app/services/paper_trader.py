class PaperTrader:
    def __init__(self, starting_cash: float = 10000):
        self.starting_cash = starting_cash
        self.cash = starting_cash
        self.positions = {}
        self.trades = []

    def buy(self, ticker: str, price: float, quantity: int):
        ticker = ticker.upper()
        cost = price * quantity

        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")

        if cost > self.cash:
            raise ValueError("Not enough paper cash")

        self.cash -= cost

        if ticker not in self.positions:
            self.positions[ticker] = {
                "quantity": 0,
                "average_price": 0
            }

        old_qty = self.positions[ticker]["quantity"]
        old_avg = self.positions[ticker]["average_price"]

        new_qty = old_qty + quantity
        new_avg = ((old_qty * old_avg) + cost) / new_qty

        self.positions[ticker]["quantity"] = new_qty
        self.positions[ticker]["average_price"] = round(new_avg, 2)

        trade = {
            "type": "BUY",
            "ticker": ticker,
            "price": round(price, 2),
            "quantity": quantity,
            "cost": round(cost, 2)
        }

        self.trades.append(trade)
        return trade

    def sell(self, ticker: str, price: float, quantity: int):
        ticker = ticker.upper()

        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")

        if ticker not in self.positions:
            raise ValueError("You do not own this stock")

        if self.positions[ticker]["quantity"] < quantity:
            raise ValueError("Not enough shares to sell")

        revenue = price * quantity
        self.cash += revenue
        self.positions[ticker]["quantity"] -= quantity

        if self.positions[ticker]["quantity"] == 0:
            del self.positions[ticker]

        trade = {
            "type": "SELL",
            "ticker": ticker,
            "price": round(price, 2),
            "quantity": quantity,
            "revenue": round(revenue, 2)
        }

        self.trades.append(trade)
        return trade

    def portfolio(self):
        return {
            "starting_cash": round(self.starting_cash, 2),
            "cash": round(self.cash, 2),
            "positions": self.positions,
            "trades": self.trades
        }
