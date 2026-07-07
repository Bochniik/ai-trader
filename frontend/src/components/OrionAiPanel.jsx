import { useEffect, useState } from "react";
import { Bot, RefreshCw } from "lucide-react";
import { getOrionAiAnalysis } from "../api/api";

export default function OrionAiPanel({ ticker }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAnalysis() {
    if (!ticker) return;

    try {
      setLoading(true);
      setMessage("");
      const data = await getOrionAiAnalysis(ticker);
      setAnalysis(data);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalysis();
  }, [ticker]);

  if (!ticker) return null;

  return (
    <section className="card orion-ai-card">
      <div className="orion-ai-header">
        <h2 className="card-title">
          <Bot size={18} />
          Orion AI
        </h2>

        <button type="button" className="ghost-btn" onClick={loadAnalysis}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading && <p className="muted">Orion is analyzing {ticker}...</p>}
      {message && <p className="error-text">{message}</p>}

      {analysis && (
        <>
          <div className="orion-ai-summary">
            <span className={`signal-pill ${analysis.outlook.toLowerCase()}`}>
              {analysis.outlook}
            </span>
            <strong>{analysis.confidence}% confidence</strong>
          </div>

          <p>{analysis.summary}</p>

          <h3>Reasons</h3>
          <ul>
            {analysis.reasons.map((reason) => (
              <li key={reason}>✓ {reason}</li>
            ))}
          </ul>

          <h3>Risks</h3>
          <ul>
            {analysis.risks.map((risk) => (
              <li key={risk}>• {risk}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}