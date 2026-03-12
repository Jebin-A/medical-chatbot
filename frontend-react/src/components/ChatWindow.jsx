import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ChatWindow({ messages, loading, onSend, fileReady }) {
  const [input, setInput] = useState("Analyze this report and explain the findings in simple language.");

  function handleSend() {
    if (!input.trim() || !fileReady) return;
    onSend(input);
    setInput("");
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>👆 Upload a report and ask a question to get started.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="bubble">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="bubble loading">
              <span className="dot"/><span className="dot"/><span className="dot"/>
            </div>
          </div>
        )}
      </div>

      <div className="input-row">
        <textarea
          className="chat-input"
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={fileReady ? "Ask a question about the report..." : "Upload a report first..."}
          disabled={!fileReady}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!fileReady || loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}