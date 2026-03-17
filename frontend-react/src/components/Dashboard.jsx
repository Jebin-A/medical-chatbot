import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard({ values }) {
  if (!values || values.length === 0) return null;

  const colorMap = { Normal: "#2E7D32", High: "#B71C1C", Low: "#F57F17" };

  const data = values.map(v => ({
    name:   v.name.length > 12 ? v.name.slice(0, 12) + "…" : v.name,
    value:  parseFloat(v.value) || 0,
    status: v.status,
    full:   v.name,
    unit:   v.unit,
    range:  v.normal_range,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tt-name">{d.full}</p>
          <p className="tt-val">{payload[0].value} {d.unit}</p>
          <p className="tt-range">Normal: {d.range}</p>
          <p className="tt-status" style={{ color: colorMap[d.status] }}>{d.status}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-card">
      <p className="dashboard-title">Lab Values Dashboard</p>
      <div className="legend-row">
        {["Normal", "High", "Low"].map(s => (
          <span key={s} className="legend-item">
            <span className="legend-dot" style={{ background: colorMap[s] }}/>
            {s}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0}/>
          <YAxis tick={{ fontSize: 10 }}/>
          <Tooltip content={<CustomTooltip />}/>
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={colorMap[entry.status] || "#888"}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="values-table">
        {values.map((v, i) => (
          <div key={i} className="value-row">
            <span className="v-name">{v.name}</span>
            <span className="v-val">{v.value} {v.unit}</span>
            <span className="v-range">{v.normal_range}</span>
            <span className="v-status" style={{ color: colorMap[v.status] || "#888" }}>{v.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}