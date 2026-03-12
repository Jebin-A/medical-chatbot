import { useState } from "react";
import Dropzone from "./components/Dropzone";
import ChatWindow from "./components/ChatWindow";
import Header from "./components/Header";

export default function App() {
  const [file, setFile]       = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);

  async function analyze(question) {
    if (!file) return;

    const userMsg = { role: "user", text: question };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("question", question);

    try {
      const res  = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const botMsg = {
        role: "bot",
        text: data.answer || data.error || "No response received."
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "bot",
        text: "Could not connect to backend. Make sure uvicorn is running on port 8000."
      }]);
    }

    setLoading(false);
  }

  return (
    <div className="app">
      <Header />
      <div className="main">
        <div className="sidebar">
          <Dropzone file={file} setFile={setFile} />
          {file && (
            <div className="file-info">
              <span className="file-icon">📄</span>
              <span className="file-name">{file.name}</span>
            </div>
          )}
          <div className="sidebar-note">
            Supported: PDF, JPG, PNG
          </div>
        </div>
        <div className="chat-area">
          <ChatWindow
            messages={messages}
            loading={loading}
            onSend={analyze}
            fileReady={!!file}
          />
        </div>
      </div>
    </div>
  );
}