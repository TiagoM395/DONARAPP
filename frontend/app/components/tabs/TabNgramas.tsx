"use client";
import { useState } from "react";
import { fetchJSON, API, PP_UMBRAL } from "../../lib/api";
import { btn, inp, tbl } from "../../lib/tokens";
import { Card, SectionTitle } from "../ui/Card";
import { InfoTag } from "../ui/InfoTag";

export function TabNgramas({ isMobile }: { isMobile: boolean }) {
  const [k, setK]                     = useState(1.0);
  const [bigramas, setBigramas]       = useState<any[]>([]);
  const [trigramas, setTrigramas]     = useState<any[]>([]);
  const [textopp, setTextopp]         = useState("");
  const [ppResult, setPpResult]       = useState<{ perplejidad: number; fuera_de_dominio: boolean } | null>(null);
  const [palabraSig, setPalabraSig]   = useState("");
  const [siguientes, setSiguientes]   = useState<any | null>(null);
  const [inicioGen, setInicioGen]     = useState("");
  const [generado, setGenerado]       = useState("");

  const cargar = async () => {
    const [b, t] = await Promise.all([
      fetchJSON(`${API}/ngramas/tabla_bigramas?top_n=10&k=${k}`),
      fetchJSON(`${API}/ngramas/tabla_trigramas?top_n=10&k=${k}`),
    ]);
    setBigramas(b.tabla); setTrigramas(t.tabla);
  };

  const calcPP = async () => {
    if (!textopp.trim()) return;
    const d = await fetchJSON(`${API}/ngramas/perplejidad?texto=${encodeURIComponent(textopp)}&k=${k}`);
    setPpResult(d);
  };

  const calcSig = async () => {
    if (!palabraSig.trim()) return;
    const d = await fetchJSON(`${API}/ngramas/siguiente?palabra=${encodeURIComponent(palabraSig.trim())}&k=${k}`);
    setSiguientes(d);
  };

  const generar = async () => {
    if (!inicioGen.trim()) return;
    const d = await fetchJSON(`${API}/ngramas/generar?inicio=${encodeURIComponent(inicioGen.trim())}&k=${k}`);
    setGenerado(d.generado);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header + k */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Modelo de N-gramas</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              Bigramas y trigramas con suavizado Add-k sobre el corpus de donación.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              Parámetro <strong>k</strong>
              <InfoTag titulo="Add-k Smoothing" texto="Evita probabilidades 0 para n-gramas no vistos. k=1 = suavizado de Laplace. k pequeño = más fiel al corpus." />:
              <input type="number" min={0.01} max={10} step={0.01} value={k}
                onChange={e => setK(parseFloat(e.target.value))}
                style={{ width: 72, padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1",
                  fontSize: 14, marginLeft: 6 }} />
            </label>
            <button style={btn.primary} onClick={cargar}>Calcular tablas</button>
          </div>
        </div>
      </Card>

      {/* Calculadora de perplejidad */}
      <Card>
        <SectionTitle>
          Calculadora de Perplejidad
          <InfoTag titulo="Perplejidad" texto={`Mide cuán "sorpresivo" es un texto para el modelo. Umbral: ${PP_UMBRAL}. Debajo = dentro del dominio. Arriba = posiblemente fuera del tema.`} />
        </SectionTitle>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
          Ingresá cualquier frase para ver si el modelo la considera dentro del dominio de donación de sangre.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <input value={textopp} onChange={e => setTextopp(e.target.value)} onKeyDown={e => e.key === "Enter" && calcPP()}
            placeholder="Ej: tuve dengue hace un mes... / hola como estás..."
            style={{ ...inp, flex: 1, marginBottom: 0 }} />
          <button style={{ ...btn.primary, flexShrink: 0 }} onClick={calcPP}>Calcular</button>
        </div>
        {ppResult && (
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 8,
            background: ppResult.fuera_de_dominio ? "#fffbeb" : "#f0fdf4",
            border: `1px solid ${ppResult.fuera_de_dominio ? "#fbbf24" : "#86efac"}`,
            display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{ppResult.fuera_de_dominio ? "⚠️" : "✅"}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Perplejidad: {ppResult.perplejidad}</div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                {ppResult.fuera_de_dominio
                  ? `Por encima del umbral (${PP_UMBRAL}) — texto fuera del dominio de donación`
                  : `Por debajo del umbral (${PP_UMBRAL}) — consulta dentro del dominio`}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Probabilidad condicional */}
      <Card>
        <SectionTitle>
          Probabilidad condicional P(siguiente | palabra)
          <InfoTag titulo="P(w | ctx)" texto="Dado un contexto (palabra anterior), muestra las palabras más probables según el modelo de bigramas entrenado en el corpus." />
        </SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <input value={palabraSig} onChange={e => setPalabraSig(e.target.value)} onKeyDown={e => e.key === "Enter" && calcSig()}
            placeholder="Ej: tatuaje, dengue, donar, esperar..."
            style={{ ...inp, flex: 1, marginBottom: 0 }} />
          <button style={{ ...btn.primary, flexShrink: 0 }} onClick={calcSig}>Consultar</button>
        </div>
        {siguientes && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
              Top palabras que siguen a <strong>"{siguientes.contexto}"</strong>:
            </div>
            {siguientes.siguientes.length === 0
              ? <span style={{ color: "#94a3b8", fontSize: 13 }}>Palabra no vista en el corpus de entrenamiento.</span>
              : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {siguientes.siguientes.map((s: any, i: number) => {
                    const COLORS = ["#2563eb","#16a34a","#d97706","#7c3aed","#0891b2","#db2777"];
                    return (
                      <div key={i} style={{ textAlign: "center", padding: "10px 16px",
                        background: "#f8fafc", border: `2px solid ${COLORS[i % COLORS.length]}22`,
                        borderRadius: 10, minWidth: 80 }}>
                        <div style={{ fontWeight: 800, color: COLORS[i % COLORS.length], fontSize: 14 }}>{s.palabra}</div>
                        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{(s.prob * 100).toFixed(1)}%</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>n={s.conteo}</div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}
      </Card>

      {/* Generación de texto */}
      <Card>
        <SectionTitle>
          Generación de texto con N-gramas
          <InfoTag titulo="Generación estadística" texto="El modelo selecciona la siguiente palabra según probabilidades de bigramas. Demostración del modelo de lenguaje estadístico entrenado en el corpus." />
        </SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <input value={inicioGen} onChange={e => setInicioGen(e.target.value)} onKeyDown={e => e.key === "Enter" && generar()}
            placeholder="Ej: me hice un tatuaje..."
            style={{ ...inp, flex: 1, marginBottom: 0 }} />
          <button style={{ ...btn.primary, flexShrink: 0 }} onClick={generar}>Generar</button>
        </div>
        {generado && (
          <div style={{ marginTop: 14, padding: "14px 18px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: 11, color: "#3b82f6", marginBottom: 4, fontWeight: 700 }}>Texto generado:</div>
            <div style={{ fontSize: 15, fontStyle: "italic", color: "#0f172a" }}>"{generado}"</div>
          </div>
        )}
      </Card>

      {/* Tablas N-gramas */}
      {(bigramas.length > 0 || trigramas.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
          {bigramas.length > 0 && (
            <Card style={{ overflowX: "auto" }}>
              <SectionTitle>Top-10 Bigramas (k={k})</SectionTitle>
              <table style={tbl.table}>
                <thead><tr>
                  <th style={tbl.th}>Contexto</th><th style={tbl.th}>Siguiente</th>
                  <th style={tbl.th}>P(w|ctx)</th><th style={tbl.th}>n</th>
                </tr></thead>
                <tbody>
                  {bigramas.map((r, i) => (
                    <tr key={i}>
                      <td style={tbl.td}>{r.contexto}</td><td style={tbl.td}>{r.siguiente}</td>
                      <td style={tbl.td}>{r.prob}</td><td style={tbl.td}>{r.conteo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          {trigramas.length > 0 && (
            <Card style={{ overflowX: "auto" }}>
              <SectionTitle>Top-10 Trigramas (k={k})</SectionTitle>
              <table style={tbl.table}>
                <thead><tr>
                  <th style={tbl.th}>Contexto</th><th style={tbl.th}>Siguiente</th>
                  <th style={tbl.th}>P(w|ctx)</th><th style={tbl.th}>n</th>
                </tr></thead>
                <tbody>
                  {trigramas.map((r, i) => (
                    <tr key={i}>
                      <td style={tbl.td}>{r.contexto}</td><td style={tbl.td}>{r.siguiente}</td>
                      <td style={tbl.td}>{r.prob}</td><td style={tbl.td}>{r.conteo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
      {bigramas.length === 0 && trigramas.length === 0 && (
        <Card style={{ textAlign: "center", color: "#64748b", padding: 32 }}>
          Hacé clic en <strong>Calcular tablas</strong> para ver los n-gramas del modelo.
        </Card>
      )}
    </div>
  );
}
