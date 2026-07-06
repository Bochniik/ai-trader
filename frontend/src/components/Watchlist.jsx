import { Search } from "lucide-react";

export default function Watchlist({
  watchlist,
  onSelectStock,
  onRemoveStock,
}) {
  return (
    <section className="card watchlist-card">
      <div className="card-title">
        <Search size={20} />
        Watchlist
      </div>

      <div className="watchlist">
        {watchlist.map((symbol) => (
          <div className="watch-item" key={symbol}>
            <button className="watch-symbol" onClick={() => onSelectStock(symbol)}>
              {symbol}
            </button>
            <button className="remove-btn" onClick={() => onRemoveStock(symbol)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}