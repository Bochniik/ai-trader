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

export function getQuote(ticker, options = {}) {
  return request(`/quote/${ticker}`, options);
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