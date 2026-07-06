import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bot, Search, Wallet, TrendingUp, Activity, PlayCircle } from "lucide-react";
import "./styles.css";
import SignalBadge from "./components/SignalBadge";
import CandleChart from "./components/CandleChart";
import Watchlist from "./components/Watchlist";

const API = "http://127.0.0.1:8000";

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [searchResults, setSearchResults] = useState([]);
  const [watchlist, setWatchlist] = useState(["AAPL", "MSFT", "NVDA", "TSLA"]);
  const [analysis, setAnalysis] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [botResult, setBotResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chartRefresh, setChartRefresh] = useState(0);

  async function request(path, options = {}) {
    const res = await fetch(`${API}${path}`, options);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Request failed");
    }
    return data;
  }

  function addToWatchlist() {
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) return;

    if (!watchlist.includes(cleanTicker)) {
      setWatchlist([...watchlist, cleanTicker]);
      setMessage(`${cleanTicker} added to watchlist`);
    } else {
      setMessage(`${cleanTicker} is already in your watchlist`);
    }
  }

  async function searchStocks(value) {
    const clean = value.toUpperCase();
    setTicker(clean);

    if (clean.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await request(`/search?q=${encodeURIComponent(clean)}`);
      setSearchResults(data.results || []);
    } catch (err) {
      setSearchResults([]);
      setMessage(err.message);
    }
  }

  async function selectSearchResult(symbol) {
    setTicker(symbol);
    setSearchResults([]);

    try {
      setLoading(true);
      setMessage("");
      const data = await request(`/analyze/${symbol}`);
      setAnalysis(data);
      setChartRefresh((old) => old + 1);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }
  function removeFromWatchlist(symbol) {
    setWatchlist(watchlist.filter((item) => item !== symbol));
    setMessage(`${symbol} removed from watchlist`);
  }

  async function selectWatchlistStock(symbol) {
    setTicker(symbol);
    setSearchResults([]);
    try {
      setLoading(true);
      setMessage("");
      const data = await request(`/analyze/${symbol}`);
      setAnalysis(data);
      setChartRefresh((old) => old + 1);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeStock() {
    try {
      setLoading(true);
      setMessage("");
      setSearchResults([]);
      const cleanTicker = ticker.trim().toUpperCase() || "AAPL";
      setTicker(cleanTicker);
      const data = await request(`/analyze/${cleanTicker}`);
      setAnalysis(data);
      setChartRefresh((old) => old + 1);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPortfolio() {
    try {
      const data = await request("/paper/portfolio");
      setPortfolio(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function buyStock() {
    try {
      const data = await request(`/paper/buy/${ticker}?quantity=1`, { method: "POST" });
      setMessage(data.message);
      setPortfolio(data.portfolio);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function sellStock() {
    try {
      const data = await request(`/paper/sell/${ticker}?quantity=1`, { method: "POST" });
      setMessage(data.message);
      setPortfolio(data.portfolio);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function runBot() {
    try {
      setLoading(true);
      setSearchResults([]);
      const data = await request(`/bot/run/${ticker}?quantity=1`, { method: "POST" });
      setBotResult(data);
      setAnalysis(data.analysis);
      setPortfolio(data.portfolio);
      setChartRefresh((old) => old + 1);
      setMessage(`Bot action: ${data.action_taken}`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    analyzeStock();
    loadPortfolio();
  }, []);

  const positions = portfolio?.positions || {};
  const trades = portfolio?.trades || [];

  return (
    <div className="app">
      <header>
        <div>
          <h1>AI Trader</h1>
          <p>Interactive paper-trading dashboard</p>
        </div>
        <div className="status">
          <Activity size={18} />
          Backend connected
        </div>
      </header>

      {message && <div className="message">{message}</div>}

      <section className="grid top-grid">
        <div className="card hero">
          <div className="card-title">
            <Search size={20} />
            Analyze stock
          </div>
          <div className="search-row">
            <div className="search-wrapper">
              <input
                value={ticker}
                onChange={(e) => searchStocks(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyzeStock()}
                placeholder="Search ticker or company..."
              />

  {searchResults.length > 0 && (
    <div className="search-dropdown">
      {searchResults.map((stock) => (
        <button
          key={stock.ticker}
          className="search-result"
          onClick={() => selectSearchResult(stock.ticker)}
        >
          <span>{stock.name}</span>
          <b>{stock.ticker}</b>
          <small>{stock.sector}</small>
        </button>
      ))}
    </div>
  )}
</div>
            <button onClick={analyzeStock} disabled={loading}>
              Analyze
            </button>
          </div>
          <div className="actions">
            <button onClick={buyStock}>Buy 1</button>
            <button onClick={sellStock}>Sell 1</button>
            <button className="watch-btn" onClick={addToWatchlist}>Add Watchlist</button>
            <button className="bot-btn" onClick={runBot}>
              <PlayCircle size={16} /> Run Bot
            </button>
          </div>
        </div>

        <div className="card metric">
          <div className="card-title">
            <Wallet size={20} />
            Paper cash
          </div>
          <div className="big">${portfolio?.cash?.toLocaleString() ?? "..."}</div>
          <p>Starting cash: ${portfolio?.starting_cash?.toLocaleString() ?? "..."}</p>
        </div>

        <div className="card metric">
          <div className="card-title">
            <Bot size={20} />
            Latest signal
          </div>
          <div className="big"><SignalBadge signal={analysis?.signal} /></div>
          <p>Confidence: {analysis?.confidence_score ?? "..."}%</p>
        </div>
      </section>

<Watchlist
  watchlist={watchlist}
  onSelectStock={selectWatchlistStock}
  onRemoveStock={removeFromWatchlist}
/>

      <section className="card chart-card">
        <div className="card-title">
          <TrendingUp size={20} />
          Candlestick chart
        </div>
        <CandleChart ticker={ticker} refreshKey={chartRefresh} />
      </section>

      <section className="grid main-grid">
        <div className="card">
          <div className="card-title">
            <TrendingUp size={20} />
            Analysis
          </div>

          {!analysis ? (
            <p>No analysis loaded yet.</p>
          ) : (
            <>
              <div className="analysis-header">
                <div>
                  <h2>{analysis.ticker}</h2>
                  <p className="price">${analysis.price}</p>
                </div>
                <SignalBadge signal={analysis.signal} />
              </div>

              <div className="confidence">
                <div style={{ width: `${analysis.confidence_score}%` }} />
              </div>

              <div className="indicator-grid">
                <div>RSI <b>{analysis.indicators.rsi}</b></div>
                <div>SMA 20 <b>{analysis.indicators.sma_20}</b></div>
                <div>SMA 50 <b>{analysis.indicators.sma_50}</b></div>
                <div>EMA 20 <b>{analysis.indicators.ema_20}</b></div>
              </div>

              <h3>Reasons</h3>
              <ul>
                {analysis.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </>
          )}
        </div>

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
      </section>

      {botResult && (
        <section className="card">
          <div className="card-title">
            <Bot size={20} />
            Bot result
          </div>
          <p><b>Action taken:</b> {botResult.action_taken}</p>
          <p><b>Signal detected:</b> {botResult.signal}</p>
        </section>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);