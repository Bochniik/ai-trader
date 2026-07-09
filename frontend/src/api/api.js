const API_BASE_URL = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}

export function analyzeStock(ticker) {
  return request(`/analyze/${ticker}`);
}

export function getCandles(ticker, period = "6mo", interval = "1d") {
  const params = new URLSearchParams({ period, interval });
  return request(`/candles/${ticker}?${params.toString()}`);
}

export function getNews(ticker) {
  return request(`/news/${ticker}`);
}

export function getPortfolio() {
  return request("/paper/portfolio");
}

export function buyStock(ticker, quantity = 1) {
  return request(`/paper/buy/${ticker}?quantity=${quantity}`, {
    method: "POST",
  });
}

export function sellStock(ticker, quantity = 1) {
  return request(`/paper/sell/${ticker}?quantity=${quantity}`, {
    method: "POST",
  });
}

export function runBot(ticker, quantity = 1) {
  return request(`/bot/run/${ticker}?quantity=${quantity}`, {
    method: "POST",
  });
}

export function searchStocks(query) {
  return request(`/search?q=${encodeURIComponent(query)}`);
}

export function getQuote(ticker) {
  return request(`/quote/${ticker}`);
}

export function getOrionAiAnalysis(ticker) {
  return request(`/orion-ai/${ticker}`);
}

export function askOrion(ticker, question, history = []) {
  return request("/orion-ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ticker,
      question,
      history,
    }),
  });
}