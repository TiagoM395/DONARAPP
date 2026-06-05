"use client";
import { useState } from "react";
import { fetchJSON, API } from "../../lib/api";
import { btn, inp, tbl } from "../../lib/tokens";
import { Card, SectionTitle, StatCard } from "../ui/Card";
import { InfoTag } from "../ui/InfoTag";

export function TabIR({ isMobile }: { isMobile: boolean }) {
  const [query, setQuery]           = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [metricas, setMetricas]     = useState<any>(null);

  const buscar = async () => {
    if (!query.trim()) return;
    const data = await fetchJSON(`${API}/buscar?q=${encodeURIComponent(query)}&top_k=5`);
    setResultados(data);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
          Recuperación de Información — TF-IDF
          <InfoTag titulo="TF-IDF" texto="Term Frequency × Inverse Document Frequency. Pondera palabras frecuentes en un doc pero raras en el corpus. Similitud coseno entre vectores." />
        </h2>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
          Motor de búsqueda sobre el corpus de donación de sangre (20 documentos).
        </p>
      </div>

      {/* Buscador */}
      <Card>
        <SectionTitle>Búsqueda en el corpus</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && buscar()}
            placeholder="Ej: tatuaje meses esperar donar sangre"
            style={{ ...inp, flex: 1, marginBottom: 0 }} />
          <button style={{ ...btn.primary, flexShrink: 0 }} onClick={buscar}>Buscar</button>
        </div>
        {resultados.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Top {resultados.length} documentos por similitud coseno:</div>
            {resultados.map((r, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Documento #{i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb",
                    background: "#eff6ff", padding: "2px 8px", borderRadius: 4 }}>
                    Score: {r.score}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{r.snippet}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Métricas P/R/F1 */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div>
            <SectionTitle>Evaluación — Precisión / Recall / F1</SectionTitle>
            <p style={{ fontSize: 13, color: "#64748b", margin: "-8px 0 0" }}>
              Evaluado sobre 10 consultas etiquetadas con documentos relevantes del corpus.
            </p>
          </div>
          <button style={btn.primary} onClick={async () => {
            const data = await fetchJSON(`${API}/ir/metricas`);
            setMetricas(data);
          }}>Cargar métricas</button>
        </div>

        {metricas && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              <StatCard title="Precisión promedio" value={metricas.promedio.precision} color="#2563eb" />
              <StatCard title="Recall promedio"    value={metricas.promedio.recall}    color="#16a34a" />
              <StatCard title="F1 promedio"        value={metricas.promedio.f1}        color="#d97706" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, marginBottom: 10 }}>
              DETALLE POR CONSULTA
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={tbl.table}>
                <thead><tr>
                  <th style={tbl.th}>Query</th>
                  <th style={tbl.th}>Precisión</th>
                  <th style={tbl.th}>Recall</th>
                  <th style={tbl.th}>F1</th>
                </tr></thead>
                <tbody>
                  {metricas.por_consulta.map((r: any, i: number) => (
                    <tr key={i}>
                      <td style={tbl.td}>{r.query}</td>
                      <td style={tbl.td}>{r.precision}</td>
                      <td style={tbl.td}>{r.recall}</td>
                      <td style={{ ...tbl.td, fontWeight: 700, color: r.f1 >= 0.5 ? "#16a34a" : "#dc2626" }}>{r.f1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
