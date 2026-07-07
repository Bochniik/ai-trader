import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bot, Search, Wallet, TrendingUp, Activity, PlayCircle } from "lucide-react";
import "./styles.css";
import SignalBadge from "./components/SignalBadge";
import CandleChart from "./components/CandleChart";
import Watchlist from "./components/Watchlist";
import PortfolioPanel from "./components/PortfolioPanel";
import AnalysisPanel from "./components/AnalysisPanel";
import BotPanel from "./components/BotPanel";
import SearchPanel from "./components/SearchPanel";
import LiveQuoteCard from "./components/LiveQuoteCard";
import FavoritesPanel from "./components/FavoritesPanel";
import StockNewsPanel from "./components/StockNewsPanel";
import {
  analyzeStock as apiAnalyzeStock,
  getPortfolio,
  buyStock as apiBuyStock,
  sellStock as apiSellStock,
  runBot as apiRunBot,
  searchStocks as apiSearchStocks,
  getQuote as apiGetQuote,
  getNews as apiGetNews,
} from "./api/api";

const RECENT_SEARCHES_KEY = "orion_recent_searches";
const FAVORITES_KEY = "orion_favorites";
const MAX_RECENT_SEARCHES = 8;
const MAX_FAVORITES = 12;

function getSavedList(key) {
  try {
    const saved = window.localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState(() => getSavedList(RECENT_SEARCHES_KEY));
  const [favorites, setFavorites] = useState(() => getSavedList(FAVORITES_KEY));
  const [watchlist, setWatchlist] = useState(["AAPL", "MSFT", "NVDA", "TSLA"]);
  const [analysis, setAnalysis] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [botResult, setBotResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chartRefresh, setChartRefresh] = useState(0);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteDirection, setQuoteDirection] = useState(null);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState("");
  const lastQuotePrice = useRef(null);

  function saveFavorites(nextFavorites) {
    setFavorites(nextFavorites);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));
  }

  function toggleFavorite() {
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) return;

    if (favorites.includes(cleanTicker)) {
      saveFavorites(favorites.filter((item) => item !== cleanTicker));
      setMessage(`${cleanTicker} removed from favorites`);
      return;
    }

    saveFavorites([cleanTicker, ...favorites].slice(0, MAX_FAVORITES));
    setMessage(`${cleanTicker} added to favorites`);
  }

  function removeFavorite(symbol) {
    saveFavorites(favorites.filter((item) => item !== symbol));
    setMessage(`${symbol} removed from favorites`);
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

  function saveRecentSearch(symbol) {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return;

    setRecentSearches((current) => {
      const next = [
        cleanSymbol,
        ...current.filter((item) => item !== cleanSymbol),
      ].slice(0, MAX_RECENT_SEARCHES);

      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    setMessage("Recent searches cleared");
  }

  async function searchStocks(value) {
    const clean = value.toUpperCase();
    setTicker(clean);

    if (clean.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await apiSearchStocks(clean);
      setSearchResults(data.results || []);
    } catch (err) {
      setSearchResults([]);
      setMessage(err.message);
    }
  }

  async function selectSearchResult(symbol) {
    const cleanSymbol = symbol.trim().toUpperCase();
    setTicker(cleanSymbol);
    setSearchResults([]);
    saveRecentSearch(cleanSymbol);

    try {
      setLoading(true);
      setMessage("");
      const data = await apiAnalyzeStock(cleanSymbol);
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
    saveRecentSearch(symbol);
    try {
      setLoading(true);
      setMessage("");
      const data = await apiAnalyzeStock(symbol);
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
      saveRecentSearch(cleanTicker);
      const data = await apiAnalyzeStock(cleanTicker);
      setAnalysis(data);
      setChartRefresh((old) => old + 1);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadNews(symbol = ticker) {
    const cleanTicker = symbol.trim().toUpperCase();
    if (!cleanTicker) return;

    try {
      setNewsLoading(true);
      setNewsError("");
      const data = await apiGetNews(cleanTicker);
      setNews(data.news || []);
    } catch (err) {
      setNews([]);
      setNewsError(err.message);
    } finally {
      setNewsLoading(false);
    }
  }

  async function loadPortfolio() {
    try {
      const data = await getPortfolio();
      setPortfolio(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function buyStock() {
    try {
      const cleanTicker = ticker.trim().toUpperCase();
      const data = await apiBuyStock(cleanTicker, 1);
      setMessage(data.message);
      setPortfolio(data.portfolio);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function sellStock() {
    try {
      const cleanTicker = ticker.trim().toUpperCase();
      const data = await apiSellStock(cleanTicker, 1);
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
      const cleanTicker = ticker.trim().toUpperCase();
      const data = await apiRunBot(cleanTicker, 1);
      saveRecentSearch(cleanTicker);
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

  useEffect(() => {
    loadNews(ticker);
  }, [ticker]);

  useEffect(() => {
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) {
      setQuote(null);
      setQuoteError("");
      return;
    }

    const controller = new AbortController();

    async function loadQuote() {
      try {
        setQuoteLoading(true);
        setQuoteError("");
        const data = await apiGetQuote(cleanTicker, { signal: controller.signal });

        if (lastQuotePrice.current !== null && data.price !== null) {
          if (data.price > lastQuotePrice.current) setQuoteDirection("up");
          if (data.price < lastQuotePrice.current) setQuoteDirection("down");
        }

        lastQuotePrice.current = data.price;
        setQuote(data);
        window.setTimeout(() => setQuoteDirection(null), 900);
      } catch (err) {
        if (err.name !== "AbortError") {
          setQuoteError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setQuoteLoading(false);
        }
      }
    }

    lastQuotePrice.current = null;
    loadQuote();
    const intervalId = window.setInterval(loadQuote, 30000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [ticker]);

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

       <SearchPanel
          ticker={ticker}
         loading={loading}
         searchResults={searchResults}
         recentSearches={recentSearches}
         onSearchChange={searchStocks}
         onSelectResult={selectSearchResult}
         onSelectRecent={selectSearchResult}
         onClearRecent={clearRecentSearches}
         onAnalyze={analyzeStock}
          onBuy={buyStock}
          onSell={sellStock}
         onAddWatchlist={addToWatchlist}
          onRunBot={runBot}
/>

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

      <LiveQuoteCard
        quote={quote}
        loading={quoteLoading}
        error={quoteError}
        direction={quoteDirection}
        isFavorite={favorites.includes(ticker.trim().toUpperCase())}
        onToggleFavorite={toggleFavorite}
      />

      <FavoritesPanel
        favorites={favorites}
        onSelectFavorite={selectSearchResult}
        onRemoveFavorite={removeFavorite}
      />

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

      <StockNewsPanel
        ticker={ticker.trim().toUpperCase()}
        news={news}
        loading={newsLoading}
        error={newsError}
        onRefresh={() => loadNews(ticker)}
      />

      <section className="grid main-grid">
        <AnalysisPanel analysis={analysis} />
         <PortfolioPanel portfolio={portfolio} />
      </section>

     <BotPanel botResult={botResult} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);