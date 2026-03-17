import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Compare() {
  const [file1, setFile1]         = useState(null);
  const [file2, setFile2]         = useState(null);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);

  async function handleCompare() {
    if (!file1 || !file2) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file1", file1);
    formData.append("file2", file2);

    try {
      const res  = await fetch("http://127.0.0.1:8000/compare", { method: "POST", body: formData });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: "Could not connect to backend." });
    }
    setLoading(false);
  }

  const statusColor = { Normal: "#2E7D32", High: "#B71C1C", Low: "#F57F17" };

  return (
    <div className="compare-panel">
      <p className="compare-title">📊 Compare Two Reports</p>
      <p className="compare-sub">Upload two reports to see what improved or worsened.</p>

      <div className="compare-uploads">
        <div className="compare-upload-box">
          <p className="upload-label">Report 1 (Older)</p>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setFile1(e.target.files[0])}/>
          {file1 && <p className="upload-name">📄 {file1.name}</p>}
        </div>
        <div className="compare-upload-box">
          <p className="upload-label">Report 2 (Recent)</p>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setFile2(e.target.files[0])}/>
          {file2 && <p className="upload-name">📄 {file2.name}</p>}
        </div>
      </div>

      <button className="compare-btn" onClick={handleCompare}
        disabled={!file1 || !file2 || loading}>
        {loading ? "Comparing..." : "Compare Reports"}
      </button>

      {result?.error && <p className="compare-error">{result.error}</p>}

      {result?.comparison && (
        <div className="compare-result">
          <p className="compare-result-title">Comparison Analysis</p>
          <div className="compare-markdown">
            <ReactMarkdown>{result.comparison}</ReactMarkdown>
          </div>

          {result.report1?.values?.length > 0 && result.report2?.values?.length > 0 && (
            <div className="compare-table">
              <p className="compare-result-title">Value Changes</p>
              <div className="compare-header-row">
                <span>Test</span><span>Report 1</span><span>Report 2</span><span>Change</span>
              </div>
              {result.report1.values.map((v1, i) => {
                const v2   = result.report2.values.find(v => v.name === v1.name);
                const val1 = parseFloat(v1.value);
                const val2 = v2 ? parseFloat(v2.value) : null;
                const diff = val2 !== null ? (val2 - val1).toFixed(2) : "—";
                const arrow = val2 === null ? "—" : val2 > val1 ? "↑" : val2 < val1 ? "↓" : "→";
                const arrowColor = arrow === "↑" ? "#B71C1C" : arrow === "↓" ? "#1565C0" : "#888";
                return (
                  <div key={i} className="compare-value-row">
                    <span>{v1.name}</span>
                    <span style={{ color: statusColor[v1.status] }}>{v1.value} {v1.unit}</span>
                    <span style={{ color: v2 ? statusColor[v2.status] : "#888" }}>
                      {v2 ? `${v2.value} ${v2.unit}` : "—"}
                    </span>
                    <span style={{ color: arrowColor, fontWeight: "bold" }}>{arrow} {diff !== "—" ? diff : ""}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}