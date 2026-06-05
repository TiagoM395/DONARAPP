"use client";
import { useState } from "react";
import { fetchJSON, API } from "../../lib/api";
import { btn, tbl } from "../../lib/tokens";
import { Card, SectionTitle, StatCard } from "../ui/Card";
import { PieChart } from "../ui/PieChart";

const LineChart = ({ data }: { data: { dia: string; total: number }[] }) => {
  if (data.length < 2) return <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Se necesitan al menos 2 días con datos.</p>;
  const W = 500, H = 120, P = 30;
  const maxV = Math.max(...data.map(d => d.total), 1);
  const xs = data.map((_, i) => P + (i / (data.length - 1)) * (W - P * 2));
  const ys = data.map(d => H - P - (d.total / maxV) * (H - P * 2));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 130 }}>
      <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
      </linearGradient></defs>
      <path d={`${path} L${xs.at(-1)},${H - P} L${xs[0]},${H - P}Z`} fill="url(#g1)" />
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r="3.5" fill="#2563eb" />
          <text x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">{data[i].dia.slice(5)}</text>
          <text x={x} y={ys[i] - 7} textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="bold">{data[i].total}</text>
        </g>
      ))}
    </svg>
  );
};

const PIE_MAP: Record<string, { label: string; color: string }> = {
  apto:              { label: "Apto",             color: "#16a34a" },
  no_apto_temporal:  { label: "No apto (temp.)",  color: "#dc2626" },
  no_apto_permanente:{ label: "No apto (perm.)",  color: "#7c3aed" },
  consultar:         { label: "Consultar médico", color: "#2563eb" },
  fuera_de_dominio:  { label: "Fuera de dominio", color: "#d97706" },
  info:              { label: "Información",      color: "#94a3b8" },
};

export function TabDashboard({ isMobile }: { isMobile: boolean }) {
  const [stats, setStats]         = useState<any>(null);
  const [diario, setDiario]       = useState<any[]>([]);
  const [tipos, setTipos]         = useState<any[]>([]);
  const [top, setTop]             = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [palabras, setPalabras]   = useState<any[]>([]);
  const [cargando, setCargando]   = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const [st, d, t, tp, h, pw] = await Promise.all([
        fetchJSON(`${API}/stats/completo`), fetchJSON(`${API}/stats_diario`),
        fetchJSON(`${API}/stats_tipos`),    fetchJSON(`${API}/stats_top_consultas`),
        fetchJSON(`${API}/historial?limit=10`), fetchJSON(`${API}/palabras_frecuentes?top_n=30`),
      ]);
      setStats(st); setDiario(d); setTipos(t); setTop(tp); setHistorial(h); setPalabras(pw);
    } finally { setCargando(false); }
  };

  const exportarCSV = () => {
    if (!historial.length) return;
    const cols = ["id", "texto", "resultado", "intencion", "perplejidad", "score_ir", "tiempo_respuesta_ms", "origen", "fecha"];
    const rows = historial.map((h: any) => cols.map(k => JSON.stringify(h[k] ?? "")).join(","));
    const blob = new Blob(["﻿" + [cols.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "historial_donar.csv" });
    a.click();
  };

  const maxFreq = Math.max(...palabras.map(p => p.freq), 1);
  const maxTop  = Math.max(...top.map(t => t.total), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Dashboard</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Métricas y estadísticas del sistema</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={cargar} disabled={cargando} style={{ ...btn.primary, opacity: cargando ? 0.7 : 1 }}>
            {cargando ? "⏳ Cargando…" : "🔄 Actualizar"}
          </button>
          {historial.length > 0 && (
            <button type="button" onClick={exportarCSV} style={{ ...btn.primary, background: "#16a34a" }}>
              ⬇️ Exportar CSV
            </button>
          )}
        </div>
      </div>

      {cargando && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 12, padding: "18px 16px", background: "#f1f5f9",
                animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.08}s` }}>
                <div style={{ height: 11, width: "60%", borderRadius: 6, background: "#e2e8f0", marginBottom: 10 }} />
                <div style={{ height: 26, width: "40%", borderRadius: 6, background: "#e2e8f0" }} />
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 12, padding: 24, background: "#f1f5f9",
            animation: "pulse 1.4s ease-in-out infinite" }}>
            <div style={{ height: 12, width: "30%", borderRadius: 6, background: "#e2e8f0", marginBottom: 16 }} />
            <div style={{ height: 140, borderRadius: 8, background: "#e2e8f0" }} />
          </div>
        </div>
      )}

      {!stats && !cargando && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <p style={{ color: "#64748b", margin: 0 }}>Hacé clic en <strong>Actualizar</strong> para cargar las estadísticas.</p>
        </Card>
      )}

      {stats && (
        <>
          {/* Stats globales */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, marginBottom: 10 }}>
              RESUMEN GENERAL
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "130px" : "150px"}, 1fr))`, gap: 12 }}>
              <StatCard title="Total consultas"  value={stats.total}               color="#2563eb" />
              <StatCard title="Aptos"             value={stats.aptos}               color="#16a34a" />
              <StatCard title="No aptos"          value={stats.no_aptos}            color="#dc2626" />
              <StatCard title="PP promedio"       value={stats.pp_promedio}         color="#d97706" />
              <StatCard title="Score IR promedio" value={stats.score_ir_promedio}   color="#0891b2" />
              <StatCard title="Tiempo promedio"   value={`${stats.tiempo_promedio_ms} ms`} color="#7c3aed" />
              {stats.wer_promedio_pct !== null
                ? <StatCard title={`WER (${stats.frases_wer_evaluadas} frases)`} value={`${stats.wer_promedio_pct}%`} color="#db2777" />
                : <StatCard title="WER promedio" value="Sin datos" color="#94a3b8" />}
            </div>
          </div>

          {/* IR */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, marginBottom: 12 }}>
              MOTOR DE BÚSQUEDA (IR / TF-IDF)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <StatCard title="Precisión" value={stats.ir.precision} color="#2563eb" />
              <StatCard title="Recall"    value={stats.ir.recall}    color="#16a34a" />
              <StatCard title="F1"        value={stats.ir.f1}        color="#d97706" />
            </div>
          </Card>

          {/* Gráficos */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            {diario.length > 0 && (
              <Card>
                <SectionTitle>Consultas por día</SectionTitle>
                <LineChart data={diario} />
              </Card>
            )}
            {tipos.length > 0 && (
              <Card>
                <SectionTitle>Distribución por resultado</SectionTitle>
                <PieChart data={tipos.map((t: any) => ({
                  label: PIE_MAP[t.tipo]?.label ?? t.tipo,
                  value: t.total,
                  color: PIE_MAP[t.tipo]?.color ?? "#94a3b8",
                }))} />
              </Card>
            )}
          </div>

          {/* Top consultas + Nube */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            {top.length > 0 && (
              <Card>
                <SectionTitle>Top 10 consultas frecuentes</SectionTitle>
                {top.map((t: any, i: number) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 3 }}>{t.texto}</div>
                    <div style={{ position: "relative", background: "#e2e8f0", height: 16, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, background: "#0891b2", width: `${(t.total / maxTop) * 100}%` }} />
                      <span style={{ position: "absolute", right: 6, top: 1, fontSize: 10, fontWeight: 700, color: "#0f172a" }}>{t.total}</span>
                    </div>
                  </div>
                ))}
              </Card>
            )}
            {palabras.length > 0 && (
              <Card>
                <SectionTitle>Nube de palabras del corpus</SectionTitle>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {palabras.map((p: any, i: number) => {
                    const COLORS = ["#2563eb","#16a34a","#dc2626","#d97706","#7c3aed","#0891b2","#db2777"];
                    return (
                      <span key={i} title={`${p.freq} veces`} style={{
                        fontSize: 11 + Math.round((p.freq / maxFreq) * 20),
                        fontWeight: 700, opacity: 0.5 + (p.freq / maxFreq) * 0.5,
                        color: COLORS[i % COLORS.length], cursor: "default",
                      }}>{p.term}</span>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Historial */}
          {historial.length > 0 && (
            <Card>
              <SectionTitle>Últimas 10 consultas</SectionTitle>
              <div style={{ overflowX: "auto" }}>
                <table style={tbl.table}>
                  <thead>
                    <tr>
                      {["#", "Texto", "Resultado", "PP", "IR", "ms", "Origen"].map(h => (
                        <th key={h} style={tbl.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h: any) => (
                      <tr key={h.id}>
                        <td style={tbl.td}>{h.id}</td>
                        <td style={tbl.td}>{h.texto?.slice(0, 35)}…</td>
                        <td style={{ ...tbl.td, fontWeight: 700, fontSize: 11,
                          color: h.resultado === "apto" ? "#16a34a" : h.resultado?.startsWith("no_") ? "#dc2626" : "#64748b" }}>
                          {h.resultado}
                        </td>
                        <td style={tbl.td}>{h.perplejidad}</td>
                        <td style={tbl.td}>{h.score_ir}</td>
                        <td style={tbl.td}>{h.tiempo_respuesta_ms}</td>
                        <td style={tbl.td}>{h.origen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
