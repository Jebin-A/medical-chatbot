import { useState, useRef } from "react";
import Dropzone from "./components/Dropzone";
import ChatWindow from "./components/ChatWindow";
import Header from "./components/Header";

export default function App() {
  const [file, setFile]         = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const fileRef                 = useRef(null);

  // Keep file reference updated
  function handleSetFile(f) {
    setFile(f);
    fileRef.current = f;
    setMessages([]); // clear chat when new file uploaded
  }

  async function analyze(question) {
    const currentFile = fileRef.current;
    if (!currentFile) return;

    const userMsg = { role: "user", text: question };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", currentFile);
    formData.append("question", question);
    formData.append("history", JSON.stringify(messages)); // send history

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
      setMessages([...updatedMessages, botMsg]);
    } catch (err) {
      setMessages([...updatedMessages, {
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
          <Dropzone file={file} setFile={handleSetFile} />
          {file && (
            <div className="file-info">
              <span className="file-icon">📄</span>
              <span className="file-name">{file.name}</span>
            </div>
          )}
          {messages.length > 0 && (
            <button className="clear-btn" onClick={() => setMessages([])}>
              Clear Chat
            </button>
          )}
          <div className="sidebar-note">Supported: PDF, JPG, PNG</div>
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