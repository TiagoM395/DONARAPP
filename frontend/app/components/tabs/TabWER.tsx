"use client";
import { useState } from "react";
import { fetchJSON, API } from "../../lib/api";
import { btn, inp, tbl } from "../../lib/tokens";
import { Card, SectionTitle, StatCard } from "../ui/Card";
import { InfoTag } from "../ui/InfoTag";

export function TabWER({ isMobile }: { isMobile: boolean }) {
  const [frases, setFrases]         = useState<{ id: number; frase: string }[]>([]);
  const [indice, setIndice]         = useState(0);
  const [hipotesis, setHipotesis]   = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [resumen, setResumen]       = useState<any>(null);
  const [modoDemo, setModoDemo]     = useState(false);

  const cargarFrases = async () => {
    const data = await fetchJSON(`${API}/wer/frases`);
    setFrases(data); setIndice(0); setHipotesis(""); setResultados([]); setResumen(null);
  };

  const escuchar = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Usá Chrome o Edge para el reconocimiento de voz.");
    const rec = new SR(); rec.lang = "es-AR"; setEscuchando(true); rec.start();
    rec.onresult = (e: any) => setHipotesis(e.results[0][0].transcript);
    rec.onend = () => setEscuchando(false);
  };

  const evaluar = async () => {
    if (!frases[indice] || !hipotesis.trim()) return;
    const r = await fetch(`${API}/wer/evaluar`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referencia: frases[indice].frase, hipotesis, frase_id: indice }),
    });
    const data = await r.json();
    setResultados(prev => [...prev.filter(x => x.frase_id !== indice), data]);
    setHipotesis("");
    if (indice < frases.length - 1) setIndice(indice + 1);
  };

  const wc = (w: number) => w < 0.1 ? "#16a34a" : w < 0.3 ? "#d97706" : "#dc2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
            Evaluación WER — Word Error Rate
            <InfoTag titulo="WER" texto="WER = (S+D+I)/N. S=sustituciones, D=eliminaciones, I=inserciones, N=palabras de referencia. Implementado con distancia de Levenshtein a nivel de palabras." />
          </h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Evaluá la calidad del reconocimiento de voz con 12 frases del dominio de donación.
          </p>
        </div>
        {frases.length > 0 && (
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer",
            background: "white", padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <input type="checkbox" checked={modoDemo} onChange={e => { setModoDemo(e.target.checked); setHipotesis(""); }} />
            📝 Modo demo (escribir)
          </label>
        )}
      </div>

      {frases.length === 0 ? (
        <Card>
          <div style={{ maxWidth: 520 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>¿Cómo funciona?</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>🎤</span>
                <div>
                  <strong style={{ fontSize: 13 }}>Modo normal:</strong>
                  <span style={{ fontSize: 13, color: "#475569" }}> Leé la frase en voz alta → Google ASR transcribe → se calcula el WER.</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>📝</span>
                <div>
                  <strong style={{ fontSize: 13 }}>Modo demo:</strong>
                  <span style={{ fontSize: 13, color: "#475569" }}> Escribí manualmente la "transcripción" para simular resultados sin micrófono.</span>
                </div>
              </div>
            </div>
            <button style={btn.primary} onClick={cargarFrases}>Comenzar evaluación</button>
          </div>
        </Card>
      ) : (
        <Card>
          {/* Progreso */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: "#64748b", flexShrink: 0 }}>
              {indice + 1} / {frases.length}
            </span>
            <div style={{ flex: 1, background: "#e2e8f0", height: 8, borderRadius: 4 }}>
              <div style={{ background: "#2563eb", height: "100%", borderRadius: 4, transition: "width 0.3s",
                width: `${(indice / frases.length) * 100}%` }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
              {resultados.length}/{frases.length} ✓
            </span>
          </div>

          {/* Frase */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10,
            padding: "20px 24px", marginBottom: 18, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
              {modoDemo ? "Escribí la transcripción de esta frase:" : "Leé esta frase en voz alta:"}
            </div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: "#0f172a", lineHeight: 1.5 }}>
              "{frases[indice]?.frase}"
            </div>
          </div>

          {/* Input */}
          {modoDemo ? (
            <textarea value={hipotesis} onChange={e => setHipotesis(e.target.value)}
              placeholder="Escribí aquí lo que transcribirías..."
              style={{ ...inp, height: 80, resize: "vertical", fontFamily: "inherit", marginBottom: 12 }} />
          ) : (
            <button type="button" onClick={escuchar} disabled={escuchando}
              style={{ ...btn.voice, width: "100%", marginBottom: 12 }}>
              🎤 {escuchando ? "Escuchando…" : "Hablar ahora"}
            </button>
          )}

          {hipotesis && !modoDemo && (
            <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8,
              padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>
              Transcripción detectada: <strong>"{hipotesis}"</strong>
            </div>
          )}

          <button type="button" onClick={evaluar} disabled={!hipotesis.trim()}
            style={{ ...btn.primary, width: "100%", opacity: hipotesis.trim() ? 1 : 0.5 }}>
            Evaluar → siguiente frase
          </button>

          {/* Navegador de frases */}
          <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
            {frases.map((_, i) => {
              const res = resultados.find(r => r.frase_id === i);
              return (
                <button key={i} type="button" onClick={() => { setIndice(i); setHipotesis(""); }}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 11,
                    fontWeight: 700, transition: "all 0.15s",
                    background: res ? wc(res.wer) : i === indice ? "#2563eb" : "#e2e8f0",
                    color: res || i === indice ? "white" : "#64748b" }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <SectionTitle>Resultados por frase</SectionTitle>
            <button type="button" style={btn.primary} onClick={async () => {
              const d = await fetchJSON(`${API}/wer/resumen`);
              setResumen(d);
            }}>Ver resumen global</button>
          </div>

          {resumen && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
              <StatCard title="WER promedio" value={`${resumen.wer_pct_promedio}%`} color={wc(resumen.wer_promedio)} />
              <StatCard title="Frases evaluadas" value={`${resumen.total_evaluadas} / 12`} color="#2563eb" />
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={tbl.table}>
              <thead><tr>
                {["#", "Referencia", "Transcripción", "WER", "S", "D", "I"].map(h => (
                  <th key={h} style={tbl.th}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[...resultados].sort((a, b) => a.frase_id - b.frase_id).map((r, i) => (
                  <tr key={i}>
                    <td style={tbl.td}>{r.frase_id + 1}</td>
                    <td style={tbl.td}>{r.referencia}</td>
                    <td style={tbl.td}>{r.hipotesis}</td>
                    <td style={{ ...tbl.td, fontWeight: 700, color: wc(r.wer) }}>{r.wer_pct}%</td>
                    <td style={tbl.td}>{r.S}</td>
                    <td style={tbl.td}>{r.D}</td>
                    <td style={tbl.td}>{r.I}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Limitaciones ASR */}
      <Card style={{ borderLeft: "4px solid #d97706" }}>
        <h3 style={{ margin: "0 0 14px", color: "#92400e", fontSize: 15 }}>
          ⚠️ Limitaciones del reconocimiento de voz (ASR)
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={tbl.table}>
            <thead><tr>
              <th style={tbl.th}>Factor</th>
              <th style={tbl.th}>Impacto en WER</th>
              <th style={tbl.th}>Ejemplo en este dominio</th>
            </tr></thead>
            <tbody>
              {[
                ["Ruido de fondo",           "Alto — +15-30% WER",           "Voces u otros sonidos al consultar"],
                ["Acento regional",          "Medio — +5-15% WER",           "Pronunciación argentina: 'cirugía', 'antibiótico'"],
                ["Vocabulario médico",       "Alto — palabras poco frecuentes", "'Amoxicilina', 'hepatitis', 'dengue' se transcriben mal"],
                ["Tildes y acentos",         "Bajo-Medio",                   "'Tomé' → 'tome', 'cirugía' → 'cirugia'"],
                ["Velocidad de habla",       "Medio",                        "Frases largas (#9 y #11) más propensas a errores"],
                ["Calidad del micrófono",    "Alto",                         "Micrófonos integrados vs externos"],
                ["Whisper tiny vs Google",   "Whisper tiny tiene mayor WER", "Modelo pequeño, menor vocabulario médico especializado"],
              ].map(([f, im, ej], i) => (
                <tr key={i}>
                  <td style={{ ...tbl.td, fontWeight: 600 }}>{f}</td>
                  <td style={tbl.td}>{im}</td>
                  <td style={{ ...tbl.td, fontSize: 12, color: "#64748b" }}>{ej}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
