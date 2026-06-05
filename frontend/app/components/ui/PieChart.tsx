export function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const filtered = data.filter(d => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p style={{ color: "#94a3b8", fontSize: 13 }}>Sin datos aún.</p>;
  const cx = 80, cy = 80, r = 68;
  let angle = -Math.PI / 2;
  const slices = filtered.map(d => {
    const sa = angle, ea = angle + (d.value / total) * 2 * Math.PI;
    angle = ea;
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
    return { ...d, path: `M${cx},${cy}L${x1.toFixed(1)},${y1.toFixed(1)}A${r},${r} 0 ${ea - sa > Math.PI ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)}Z` };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, flexShrink: 0 }}>
        {slices.map((sl, i) => <path key={i} d={sl.path} fill={sl.color} opacity={0.9} />)}
        <circle cx={cx} cy={cy} r={28} fill="white" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0f172a">{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <div style={{ width: 11, height: 11, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ color: "#475569" }}>{d.label}:</span>
            <span style={{ fontWeight: 700 }}>{d.value}</span>
            <span style={{ color: "#94a3b8", fontSize: 11 }}>({Math.round(d.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
