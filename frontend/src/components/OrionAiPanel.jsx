import { useEffect, useState } from "react";
import { Bot, RefreshCw } from "lucide-react";
import { getOrionAiAnalysis, askOrion } from "../api/api";

function formatOrionAnswer(text) {
  if (!text) return [];

  return text
    .replace(/\*\*/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function OrionAiPanel({ ticker }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  async function submitQuestion(event) {
    event.preventDefault();

    if (!question.trim() || !ticker) return;

    try {
      setChatLoading(true);
      setMessage("");
      const data = await askOrion(ticker, question.trim(), chatHistory);

      setChatHistory((current) => [
        ...current,
        {
          question: data.question,
          answer: data.answer,
        },
      ]);

      setQuestion("");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setChatLoading(false);
    }
  }

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
            <span className={`signal-pill ${analysis.outlook?.toLowerCase()}`}>
              {analysis.outlook}
            </span>
            <strong>{analysis.confidence}% confidence</strong>
          </div>

          <p>{analysis.summary}</p>

          <h3>Reasons</h3>
          <ul>
            {(analysis.reasons || []).map((reason) => (
              <li key={reason}>✓ {reason}</li>
            ))}
          </ul>

          <h3>Risks</h3>
          <ul>
            {(analysis.risks || []).map((risk) => (
              <li key={risk}>• {risk}</li>
            ))}
          </ul>
        </>
      )}

      <form className="orion-chat-form" onSubmit={submitQuestion}>
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={`Ask Orion about ${ticker}...`}
        />
        <button type="submit" className="primary-btn" disabled={chatLoading}>
          {chatLoading ? "Thinking..." : "Ask"}
        </button>
      </form>

      {chatHistory.length > 0 && (
        <div className="orion-chat-history">
          {chatHistory.map((item, chatIndex) => (
            <div
              className="orion-chat-answer"
              key={`${item.question}-${chatIndex}`}
            >
              <strong>You asked:</strong>
              <p>{item.question}</p>

              <strong>Orion says:</strong>
              <div className="orion-answer-block">
                {formatOrionAnswer(item.answer).map((line, lineIndex) => (
                  <p key={`${chatIndex}-${lineIndex}`}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}