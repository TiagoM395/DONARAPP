"use client";
import { useState } from "react";

export function InfoTag({ titulo, texto }: { titulo: string; texto: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", verticalAlign: "middle", marginLeft: 4 }}>
      <button type="button" onClick={() => setOpen(!open)} title={titulo}
        style={{ width: 17, height: 17, borderRadius: "50%", border: "1px solid #94a3b8", background: "#f1f5f9",
          color: "#64748b", fontSize: 10, cursor: "pointer", fontWeight: "bold",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
        ?
      </button>
      {open && (
        <div style={{ position: "absolute", left: 22, top: -6, zIndex: 300, background: "white",
          border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", width: 260,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: "#0f172a", fontSize: 13 }}>{titulo}</div>
          <div>{texto}</div>
          <button type="button" onClick={() => setOpen(false)}
            style={{ marginTop: 8, fontSize: 11, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Cerrar ×
          </button>
        </div>
      )}
    </span>
  );
}
