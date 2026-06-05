import type { CSSProperties } from "react";

export const btn = {
  primary: {
    background: "#2563eb", color: "white", border: "none",
    padding: "10px 18px", borderRadius: 8, cursor: "pointer",
    fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
  } as CSSProperties,
  voice: {
    background: "#7c3aed", color: "white", border: "none",
    padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13,
  } as CSSProperties,
};

export const inp: CSSProperties = {
  width: "100%", padding: "10px 13px", fontSize: 14, borderRadius: 8,
  border: "1.5px solid #cbd5e1", boxSizing: "border-box", outline: "none",
};

export const tbl = {
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: {
    textAlign: "left" as const, padding: "8px 12px", background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: 12,
    fontWeight: 700, whiteSpace: "nowrap" as const,
  },
  td: { padding: "8px 12px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" as const },
};
