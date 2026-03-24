import { useState, useRef } from "react";
import Dropzone from "./components/Dropzone";
import ChatWindow from "./components/ChatWindow";
import Header from "./components/Header";
import RiskScore from "./components/RiskScore";
import Dashboard from "./components/Dashboard";
import Compare from "./components/Compare";
import DoctorDashboard from "./components/DoctorDashboard";
export default function App() {
  const [file, setFile]           = useState(null);
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [riskScore, setRiskScore] = useState(null);
  const [riskLevel, setRiskLevel] = useState(null);
  const [values, setValues]       = useState([]);
  const [tab, setTab]             = useState("chat"); // "chat" | "compare"
  const fileRef                   = useRef(null);

  function handleSetFile(f) {
    setFile(f);
    fileRef.current = f;
    setMessages([]);
    setRiskScore(null);
    setRiskLevel(null);
    setValues([]);
  }

  async function analyze(question) {
    const currentFile = fileRef.current;
    if (!currentFile) return;

    const userMsg        = { role: "user", text: question };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", currentFile);
    formData.append("question", question);
    formData.append("history", JSON.stringify(messages));

    try {
      const res  = await fetch("http://127.0.0.1:8000/analyze", { method: "POST", body: formData });
      const data = await res.json();

      const botMsg = { role: "bot", text: data.answer || data.error || "No response." };
      setMessages([...updatedMessages, botMsg]);

      if (data.risk_score !== undefined) setRiskScore(data.risk_score);
      if (data.risk_level)               setRiskLevel(data.risk_level);
      if (data.values?.length > 0)       setValues(data.values);

    } catch {
      setMessages([...updatedMessages, { role: "bot", text: "Could not connect to backend." }]);
    }
    setLoading(false);
  }

  return (
    <div className="app">
      <Header />
      <div className="main">

        {/* SIDEBAR */}
        <div className="sidebar">
          <Dropzone file={file} setFile={handleSetFile} />
          {file && (
            <div className="file-info">
              <span className="file-icon">📄</span>
              <span className="file-name">{file.name}</span>
            </div>
          )}
          {messages.length > 0 && (
            <button className="clear-btn" onClick={() => { setMessages([]); setRiskScore(null); setValues([]); }}>
              Clear Chat
            </button>
          )}
          <div className="sidebar-note">Supported: PDF, JPG, PNG</div>

          {/* Risk Score */}
          {riskScore !== null && <RiskScore score={riskScore} level={riskLevel} />}
        </div>

        {/* MAIN AREA */}
        <div className="chat-area">
          {/* Tabs */}
          <div className="tabs">
            <button className={`tab-btn ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>
              💬 Chat
            </button>
            <button className={`tab-btn ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}
              disabled={values.length === 0}>
              📊 Dashboard
            </button>
            <button className={`tab-btn ${tab === "compare" ? "active" : ""}`} onClick={() => setTab("compare")}>
              🔄 Compare
            </button>
            <button className={`tab-btn ${tab === "doctor" ? "active" : ""}`} onClick={() => setTab("doctor")}>
             👨‍⚕️ Doctor Mode
            </button>
          </div>

          {tab === "chat"      && <ChatWindow messages={messages} loading={loading} onSend={analyze} fileReady={!!file} />}
          {tab === "dashboard" && <Dashboard values={values} />}
          {tab === "compare"   && <Compare />}
          {tab === "doctor" && <DoctorDashboard />}
        </div>

      </div>
    </div>
  );
}