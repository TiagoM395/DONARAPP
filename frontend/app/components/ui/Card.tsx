import type { CSSProperties, ReactNode } from "react";

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 24,
      boxShadow: "0 1px 8px rgba(0,0,0,0.07)", ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{children}</h3>;
}

export function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "white", borderRadius: 10, padding: "14px 16px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, lineHeight: 1.3 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
