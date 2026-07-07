import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { getCandles, getQuote } from "../api/api";

const CHART_RANGES = [
  { label: "1m", period: "1d", interval: "1m", live: true },
  { label: "5m", period: "5d", interval: "5m", live: true },
  { label: "15m", period: "5d", interval: "15m", live: true },
  { label: "30m", period: "1mo", interval: "30m", live: true },
  { label: "1h", period: "1mo", interval: "60m", live: true },
  { label: "1D", period: "1d", interval: "5m", live: true },
  { label: "5D", period: "5d", interval: "15m", live: true },
  { label: "1M", period: "1mo", interval: "1d", live: false },
  { label: "3M", period: "3mo", interval: "1d", live: false },
  { label: "6M", period: "6mo", interval: "1d", live: false },
  { label: "YTD", period: "ytd", interval: "1d", live: false },
  { label: "1Y", period: "1y", interval: "1wk", live: false },
  { label: "5Y", period: "5y", interval: "1mo", live: false },
];

function normalizeCandleTime(candle) {
  if (typeof candle.time === "string") return candle;

  const localOffsetSeconds = new Date().getTimezoneOffset() * 60;

  return {
    ...candle,
    time: candle.time - localOffsetSeconds,
  };
}
function formatChartTime(time) {
  if (typeof time === "string") {
    const date = new Date(`${time}T00:00:00`);

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  const date = new Date(time * 1000);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getIntervalSeconds(interval) {
  if (interval === "1m") return 60;
  if (interval === "5m") return 5 * 60;
  if (interval === "15m") return 15 * 60;
  if (interval === "30m") return 30 * 60;
  if (interval === "60m") return 60 * 60;
  return 60;
}

function getCurrentCandleTime(interval) {
  const intervalSeconds = getIntervalSeconds(interval);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const localOffsetSeconds = new Date().getTimezoneOffset() * 60;
  const localSeconds = nowSeconds - localOffsetSeconds;

  return Math.floor(localSeconds / intervalSeconds) * intervalSeconds;
}


function CandleChart({ ticker, refreshKey }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const latestCandleRef = useRef(null);

  const [chartMessage, setChartMessage] = useState("Loading chart...");
  const [liveMessage, setLiveMessage] = useState("");
  const [selectedRange, setSelectedRange] = useState(
    CHART_RANGES.find((range) => range.label === "6M")
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = "";

    const chart = createChart(chartContainerRef.current, {
      height: 360,
      formatChartTime,
      layout: {
        background: { color: "#020617" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      rightPriceScale: { borderColor: "#334155" },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
        formatChartTime,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    const resize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    async function loadCandles() {
      try {
        setChartMessage(`Loading ${selectedRange.label} chart...`);
        setLiveMessage("");

        const data = await getCandles(
          ticker,
          selectedRange.period,
          selectedRange.interval
        );

const normalizedCandles = data.candles.map(normalizeCandleTime);

seriesRef.current.setData(normalizedCandles);
latestCandleRef.current =
  normalizedCandles[normalizedCandles.length - 1] || null;

        chartRef.current.timeScale().fitContent();
        setChartMessage("");
      } catch (err) {
        setChartMessage(err.message);
      }
    }

    if (seriesRef.current) {
      loadCandles();
    }
  }, [ticker, refreshKey, selectedRange]);

  useEffect(() => {
    if (!selectedRange.live || !ticker || !seriesRef.current) {
      setLiveMessage("");
      return;
    }

    let isCancelled = false;

    async function updateLiveCandle() {
      try {
        const quote = await getQuote(ticker);
        const price = Number(quote.price);

        if (!price || !latestCandleRef.current || isCancelled) return;

const current = latestCandleRef.current;
const currentCandleTime = getCurrentCandleTime(selectedRange.interval);

let updatedCandle;

if (currentCandleTime > current.time) {
  updatedCandle = {
    time: currentCandleTime,
    open: price,
    high: price,
    low: price,
    close: price,
  };
} else {
  updatedCandle = {
    ...current,
    close: price,
    high: Math.max(current.high, price),
    low: Math.min(current.low, price),
  };
}

latestCandleRef.current = updatedCandle;
seriesRef.current.update(updatedCandle);

        setLiveMessage(`Live updating every 5s · Last price $${price.toFixed(2)}`);
      } catch {
        setLiveMessage("Live update paused");
      }
    }

    updateLiveCandle();
    const intervalId = setInterval(updateLiveCandle, 5000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [ticker, selectedRange]);

  return (
    <div>
      <div className="chart-toolbar">
        <div className="range-buttons" aria-label="Chart range selector">
          {CHART_RANGES.map((range) => (
            <button
              type="button"
              key={range.label}
              className={
                range.label === selectedRange.label
                  ? "range-btn active"
                  : "range-btn"
              }
              onClick={() => setSelectedRange(range)}
            >
              {range.label}
            </button>
          ))}
        </div>

        <span className="chart-interval-note">
          Interval: {selectedRange.interval}
          {selectedRange.live ? " · Live" : ""}
        </span>
      </div>

      {chartMessage && <p className="chart-message">{chartMessage}</p>}
      {!chartMessage && liveMessage && <p className="chart-message">{liveMessage}</p>}

      <div ref={chartContainerRef} className="chart-box" />
    </div>
  );
}

export default CandleChart;