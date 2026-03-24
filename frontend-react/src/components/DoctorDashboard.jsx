import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import ReactMarkdown from "react-markdown";

const RISK_COLOR = { Red: "#B71C1C", Yellow: "#F57F17", Green: "#2E7D32" };
const RISK_BG    = { Red: "#FFEBEE", Yellow: "#FFF8E1", Green: "#E8F5E9" };
const RISK_EMOJI = { Red: "🚨", Yellow: "⚠️", Green: "✅" };

export default function DoctorDashboard() {
  const [files,    setFiles]    = useState([]);
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState("");

  const onDrop = useCallback((accepted) => {
    setFiles(prev => {
      const existing = prev.map(f => f.name);
      const newFiles = accepted.filter(f => !existing.includes(f.name));
      return [...prev, ...newFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [], "image/jpeg": [], "image/png": [] },
    multiple: true,
  });

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  async function handleAnalyze() {
    if (files.length === 0) return;
    setLoading(true);
    setResults([]);
    setSelected(null);
    setProgress(`Analyzing ${files.length} report(s)...`);

    const formData = new FormData();
    files.forEach(f => formData.append("files", f));

    try {
      const res  = await fetch("http://127.0.0.1:8000/batch", { method: "POST", body: formData });
      const data = await res.json();
      setResults(data.results || []);
      setProgress("");
    } catch {
      setProgress("Error connecting to backend.");
    }
    setLoading(false);
  }

  function handleExport() {
    if (results.length === 0) return;
    const rows = results.map(r =>
      `${r.filename}\t${r.risk_score}/100\t${r.risk_level}\t${r.values.filter(v => v.status !== "Normal").map(v => `${v.name}: ${v.value} ${v.unit} (${v.status})`).join(", ") || "All Normal"}`
    ).join("\n");
    const blob = new Blob(["File\tRisk Score\tRisk Level\tAbnormal Values\n" + rows], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "mediscan_batch_report.txt";
    a.click();
  }

  const abnormalCount = (r) => r.values.filter(v => v.status !== "Normal").length;

  return (
    <div className="doctor-panel">

      {/* HEADER */}
      <div className="doctor-header">
        <div>
          <p className="doctor-title">👨‍⚕️ Doctor Mode — Batch Analysis</p>
          <p className="doctor-sub">Upload multiple patient reports. System will prioritize by risk level.</p>
        </div>
        {results.length > 0 && (
          <button className="export-btn" onClick={handleExport}>⬇ Export Summary</button>
        )}
      </div>

      {/* DROPZONE */}
      <div {...getRootProps()} className={`batch-dropzone ${isDragActive ? "active" : ""}`}>
        <input {...getInputProps()} />
        <span className="batch-icon">📂</span>
        {isDragActive
          ? <p className="batch-drop-text">Drop files here...</p>
          : <p className="batch-drop-text">Drag & drop reports here, or click to browse</p>
        }
        <p className="batch-sub">PDF, JPG, PNG — select as many as needed</p>
      </div>

      {/* FILE LIST */}
      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div key={i} className="file-chip">
              <span>📄 {f.name}</span>
              <button className="remove-file" onClick={() => removeFile(f.name)}>✕</button>
            </div>
          ))}
          <button className="analyze-batch-btn" onClick={handleAnalyze} disabled={loading}>
            {loading ? progress : `Analyze ${files.length} Report${files.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* SUMMARY STATS */}
      {results.length > 0 && (
        <div className="batch-stats">
          {["Red","Yellow","Green"].map(level => (
            <div key={level} className="stat-box" style={{ background: RISK_BG[level], borderColor: RISK_COLOR[level] }}>
              <span className="stat-emoji">{RISK_EMOJI[level]}</span>
              <span className="stat-count" style={{ color: RISK_COLOR[level] }}>{results.filter(r => r.risk_level === level).length}</span>
              <span className="stat-label">{level} Risk</span>
            </div>
          ))}
          <div className="stat-box" style={{ background: "#E3F2FD", borderColor: "#1565C0" }}>
            <span className="stat-emoji">📋</span>
            <span className="stat-count" style={{ color: "#1565C0" }}>{results.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {results.length > 0 && (
        <div className="doctor-main">

          {/* PATIENT TABLE */}
          <div className="patient-table">
            <div className="patient-table-header">
              <span>Risk</span>
              <span>File</span>
              <span>Score</span>
              <span>Abnormal</span>
            </div>
            {results.map((r, i) => (
              <div key={i}
                className={`patient-row ${selected === i ? "selected" : ""}`}
                onClick={() => setSelected(selected === i ? null : i)}
                style={{ borderLeft: `4px solid ${RISK_COLOR[r.risk_level]}` }}>
                <span>{RISK_EMOJI[r.risk_level]}</span>
                <span className="patient-filename">{r.filename}</span>
                <span className="patient-score" style={{ color: RISK_COLOR[r.risk_level] }}>{r.risk_score}/100</span>
                <span className="patient-abnormal">
                  {abnormalCount(r) > 0
                    ? <span style={{ color: "#B71C1C" }}>{abnormalCount(r)} abnormal</span>
                    : <span style={{ color: "#2E7D32" }}>All normal</span>}
                </span>
              </div>
            ))}
          </div>

          {/* DETAIL PANEL */}
          {selected !== null && (
            <div className="patient-detail">
              <div className="detail-header" style={{ background: RISK_BG[results[selected].risk_level] }}>
                <p className="detail-filename">{results[selected].filename}</p>
                <span className="detail-score" style={{ color: RISK_COLOR[results[selected].risk_level] }}>
                  {RISK_EMOJI[results[selected].risk_level]} {results[selected].risk_level} Risk — {results[selected].risk_score}/100
                </span>
              </div>

              {results[selected].values.filter(v => v.status !== "Normal").length > 0 && (
                <div className="detail-abnormal">
                  <p className="detail-section-title">⚠️ Abnormal Values</p>
                  {results[selected].values.filter(v => v.status !== "Normal").map((v, j) => (
                    <div key={j} className="abnormal-chip"
                      style={{ background: v.status === "High" ? "#FFEBEE" : "#FFF8E1",
                               borderColor: v.status === "High" ? "#B71C1C" : "#F57F17" }}>
                      <span className="chip-name">{v.name}</span>
                      <span className="chip-val" style={{ color: v.status === "High" ? "#B71C1C" : "#F57F17" }}>{v.value} {v.unit}</span>
                      <span className="chip-range">Normal: {v.normal_range}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="detail-analysis">
                <p className="detail-section-title">📋 Full Analysis</p>
                <div className="detail-markdown">
                  <ReactMarkdown>{results[selected].analysis}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}