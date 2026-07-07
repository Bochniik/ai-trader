import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { getCandles } from "../api/api";

const CHART_RANGES = [
  { label: "1m", period: "1d", interval: "1m" },
  { label: "5m", period: "5d", interval: "5m" },
  { label: "15m", period: "5d", interval: "15m" },
  { label: "30m", period: "1mo", interval: "30m" },
  { label: "1h", period: "1mo", interval: "60m" },
  { label: "1D", period: "1d", interval: "5m" },
  { label: "5D", period: "5d", interval: "15m" },
  { label: "1M", period: "1mo", interval: "1d" },
  { label: "3M", period: "3mo", interval: "1d" },
  { label: "6M", period: "6mo", interval: "1d" },
  { label: "YTD", period: "ytd", interval: "1d" },
  { label: "1Y", period: "1y", interval: "1d" },
  { label: "5Y", period: "5y", interval: "1wk" },
];

function CandleChart({ ticker, refreshKey }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [chartMessage, setChartMessage] = useState("Loading chart...");
  const [selectedRange, setSelectedRange] = useState(CHART_RANGES.find((range) => range.label === "6M"));

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = "";

    const chart = createChart(chartContainerRef.current, {
      height: 360,
      layout: {
        background: { color: "#020617" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      rightPriceScale: {
        borderColor: "#334155",
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
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
        const data = await getCandles(ticker, selectedRange.period, selectedRange.interval);

        seriesRef.current.setData(data.candles);
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

  return (
    <div>
      <div className="chart-toolbar">
        <div className="range-buttons" aria-label="Chart range selector">
          {CHART_RANGES.map((range) => (
            <button
              type="button"
              key={range.label}
              className={range.label === selectedRange.label ? "range-btn active" : "range-btn"}
              onClick={() => setSelectedRange(range)}
            >
              {range.label}
            </button>
          ))}
        </div>
        <span className="chart-interval-note">
          Interval: {selectedRange.interval}
        </span>
      </div>

      {chartMessage && <p className="chart-message">{chartMessage}</p>}
      <div ref={chartContainerRef} className="chart-box" />
    </div>
  );
}
export default CandleChart;
