import { useState } from "react";
import { Search, PlayCircle } from "lucide-react";

export default function SearchPanel({
  ticker,
  loading,
  searchResults,
  onSearchChange,
  onSelectResult,
  onAnalyze,
  onBuy,
  onSell,
  onAddWatchlist,
  onRunBot,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const hasResults = searchResults.length > 0;

  function handleChange(value) {
    setActiveIndex(0);
    setIsOpen(true);
    onSearchChange(value);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown" && hasResults) {
      e.preventDefault();
      setActiveIndex((old) =>
        old >= searchResults.length - 1 ? 0 : old + 1
      );
      return;
    }

    if (e.key === "ArrowUp" && hasResults) {
      e.preventDefault();
      setActiveIndex((old) =>
        old <= 0 ? searchResults.length - 1 : old - 1
      );
      return;
    }

    if (e.key === "Enter") {
      if (isOpen && hasResults) {
        e.preventDefault();
        onSelectResult(searchResults[activeIndex].ticker);
        setIsOpen(false);
      } else {
        onAnalyze();
      }
    }
  }

  function handleSelect(ticker) {
    onSelectResult(ticker);
    setIsOpen(false);
  }

  return (
    <div className="card hero">
      <div className="card-title">
        <Search size={20} />
        Analyze stock
      </div>

      <div className="search-row">
        <div className="search-wrapper">
          <input
            value={ticker}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder="Search ticker or company..."
          />

          {isOpen && ticker.trim().length > 0 && (
            <div className="search-dropdown">
              {hasResults ? (
                searchResults.map((stock, index) => (
                  <button
                    key={stock.ticker}
                    className={
                      index === activeIndex
                        ? "search-result active-result"
                        : "search-result"
                    }
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(stock.ticker)}
                  >
                    <span>{stock.name}</span>
                    <b>{stock.ticker}</b>
                    <small>{stock.sector}</small>
                  </button>
                ))
              ) : (
                <div className="no-results">
                  No matches found. Try a ticker like AAPL or NVDA.
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={onAnalyze} disabled={loading}>
          Analyze
        </button>
      </div>

      <div className="actions">
        <button onClick={onBuy}>Buy 1</button>
        <button onClick={onSell}>Sell 1</button>

        <button className="watch-btn" onClick={onAddWatchlist}>
          Add Watchlist
        </button>

        <button className="bot-btn" onClick={onRunBot}>
          <PlayCircle size={16} /> Run Bot
        </button>
      </div>
    </div>
  );
}