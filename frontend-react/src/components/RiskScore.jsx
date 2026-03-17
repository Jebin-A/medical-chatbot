export default function RiskScore({ score, level }) {
  const color = level === "Green" ? "#2E7D32" : level === "Yellow" ? "#F57F17" : "#B71C1C";
  const bg    = level === "Green" ? "#E8F5E9" : level === "Yellow" ? "#FFF8E1" : "#FFEBEE";
  const emoji = level === "Green" ? "✅" : level === "Yellow" ? "⚠️" : "🚨";

  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="risk-card" style={{ background: bg, borderColor: color }}>
      <p className="risk-title">Health Risk Score</p>
      <div className="risk-gauge">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#e0e0e0" strokeWidth="10"/>
          <circle cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
          <text x="65" y="60" textAnchor="middle" fontSize="26" fontWeight="bold" fill={color}>{score}</text>
          <text x="65" y="78" textAnchor="middle" fontSize="11" fill="#666">/100</text>
        </svg>
      </div>
      <p className="risk-level" style={{ color }}>{emoji} {level} Risk</p>
      <p className="risk-hint">
        {level === "Green" && "All values within healthy range"}
        {level === "Yellow" && "Some values need attention"}
        {level === "Red" && "Urgent — consult a doctor immediately"}
      </p>
    </div>
  );
}