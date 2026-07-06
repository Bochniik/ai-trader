import { Wallet } from "lucide-react";

export default function PortfolioPanel({ portfolio }) {
  const positions = portfolio?.positions || {};
  const trades = portfolio?.trades || [];

  return (
    <div className="card">
      <div className="card-title">
        <Wallet size={20} />
        Portfolio
      </div>

      <h3>Positions</h3>
      {Object.keys(positions).length === 0 ? (
        <p>No open positions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Qty</th>
              <th>Avg price</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(positions).map(([symbol, pos]) => (
              <tr key={symbol}>
                <td>{symbol}</td>
                <td>{pos.quantity}</td>
                <td>${pos.average_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Recent trades</h3>
      {trades.length === 0 ? (
        <p>No trades yet.</p>
      ) : (
        <div className="trade-list">
          {trades.slice().reverse().slice(0, 8).map((trade, index) => (
            <div className="trade" key={index}>
              <span className={trade.type === "BUY" ? "green" : "red"}>
                {trade.type}
              </span>
              <span>{trade.ticker}</span>
              <span>{trade.quantity} share</span>
              <span>${trade.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}