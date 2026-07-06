import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

const API = "http://127.0.0.1:8000";

function CandleChart({ ticker, refreshKey }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [chartMessage, setChartMessage] = useState("Loading chart...");

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
        setChartMessage("Loading chart...");
        const res = await fetch(`${API}/candles/${ticker}?period=6mo`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Could not load candles");
        }

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
  }, [ticker, refreshKey]);

  return (
    <div>
      {chartMessage && <p className="chart-message">{chartMessage}</p>}
      <div ref={chartContainerRef} className="chart-box" />
    </div>
  );
}
export default CandleChart;