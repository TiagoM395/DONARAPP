"use client";
import { useState } from "react";
import type { MensajeChat } from "../../types";

const TIPOS_CHAT: Record<string, { bg: string; border: string; emoji: string; label: string }> = {
  apto:              { bg: "#f0fdf4", border: "#16a34a", emoji: "✅", label: "PODÉS DONAR" },
  no_apto_temporal:  { bg: "#fff1f2", border: "#dc2626", emoji: "⏳", label: "POR EL MOMENTO NO PODES DONAR" },
  no_apto_permanente:{ bg: "#faf5ff", border: "#7c3aed", emoji: "🚫", label: "NO PODÉS DONAR (PERMANENTE)" },
  consultar:         { bg: "#eff6ff", border: "#2563eb", emoji: "🏥", label: "NECESITO MÁS INFORMACIÓN" },
  fuera_de_dominio:  { bg: "#fffbeb", border: "#d97706", emoji: "⚠️", label: "FUERA DEL DOMINIO" },
  info:              { bg: "#f8fafc", border: "#94a3b8", emoji: "ℹ️", label: "INFORMACIÓN" },
  cancelado_usuario: { bg: "#fff1f2", border: "#dc2626", emoji: "🚪", label: "POR DECISIÓN DEL USUARIO SE CANCELA EL CUESTIONARIO" },
  pregunta_ciudad:   { bg: "#f0f9ff", border: "#0284c7", emoji: "📍", label: "¡EVALUACIÓN COMPLETADA!" },
};

const avatar = (
  <div style={{
    width: 30, height: 30, borderRadius: "50%", background: "white",
    border: "1.5px solid #dc2626",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, flexShrink: 0, marginTop: 2,
  }}>🩸</div>
);

export function BotBurbuja({ msg, onOpcion, onTTS, showTts = true }: {
  msg: MensajeChat;
  onOpcion: (op: string) => void;
  onTTS: () => void;
  showTts?: boolean;
}) {
  const [detalle, setDetalle] = useState(false);
  const c = msg.consulta;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (!c) {
    const segmentos = msg.texto.split("\n\n").filter(s => s.trim());
    const renderSegmento = (seg: string, i: number) => {
      const tieneCheck = seg.includes("✓");
      const esPregunta = !tieneCheck && (i === segmentos.length - 1) && segmentos.length > 1;
      const color = tieneCheck ? "#166534" : esPregunta ? "#1e3a8a" : "#1e293b";
      const partes = seg.split("✓");
      return (
        <div key={i} style={{ color, fontSize: 15, fontWeight: tieneCheck ? 600 : 500,
          lineHeight: 1.6, whiteSpace: "pre-line",
          marginBottom: i < segmentos.length - 1 ? 4 : 0 }}>
          {partes.length > 1
            ? partes.map((p, k) => (
                <span key={k}>{p}{k < partes.length - 1 &&
                  <span style={{ color: "#16a34a", fontSize: "1.2em", fontWeight: 700 }}>✓</span>}
                </span>
              ))
            : seg}
        </div>
      );
    };
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
        {avatar}
        <div style={{ background: "#f1f5f9", borderRadius: "4px 16px 16px 16px",
          padding: "10px 14px", maxWidth: "80%", flexShrink: 1, minWidth: 0, overflow: "hidden" }}>
          {segmentos.map(renderSegmento)}
        </div>
      </div>
    );
  }

  const t = TIPOS_CHAT[c.tipo] ?? TIPOS_CHAT.info;

  const burbuja = (
    <div style={{ maxWidth: "82%", minWidth: 120, flexShrink: 1 }}>
      <div style={{
        background: t.bg, border: `1.5px solid ${t.border}`,
        borderRadius: "4px 16px 16px 16px", padding: "12px 14px",
      }}>
        <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 1, marginBottom: 2, fontWeight: 600 }}>
          SEGÚN LOS PROTOCOLOS ACTUALES
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: t.border, marginBottom: 8 }}>
          {t.emoji} {t.label}
        </div>
        <p style={{ margin: 0, fontSize: 15, color: "#0f172a", lineHeight: 1.8, fontWeight: 500 }}>
          {c.respuesta}
        </p>
        {c.opciones && c.opciones.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {c.opciones.map((op, i) => (
              <button key={i} type="button" onClick={() => onOpcion(op)}
                style={{
                  padding: "6px 13px", borderRadius: 20,
                  border: `1.5px solid ${t.border}`, background: "white",
                  color: t.border, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                {cap(op)}
              </button>
            ))}
          </div>
        )}
        {c.fuera_de_dominio && (
          <div style={{ marginTop: 8, padding: "6px 10px",
            background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 6,
            fontSize: 11, color: "#92400e" }}>
            ⚠️ Perplejidad alta ({c.perplejidad}) — la frase puede estar fuera del dominio.
          </div>
        )}
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${t.border}22`,
          display: "flex", gap: 10, alignItems: "center" }}>
          {showTts && (
            <button type="button" onClick={onTTS}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 0 }}>
              🔊
            </button>
          )}
          <button type="button" onClick={() => setDetalle(!detalle)}
            style={{ background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: "#64748b", padding: 0 }}>
            {detalle ? "▲" : "▼"} análisis técnico
          </button>
          <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>
            PP: {c.perplejidad} · IR: {c.score_ir} · {c.tiempo_ms}ms
          </span>
        </div>
        {detalle && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {c.entidades.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Entidades detectadas:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {c.entidades.map((e, i) => (
                    <span key={i} style={{ background: "#e0f2fe", border: "1px solid #7dd3fc",
                      borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#0369a1" }}>
                      {e.tipo}: <strong>{String(e.valor)}</strong>
                      {e.unidad ? ` ${e.unidad}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {c.pos.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>POS:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {c.pos.map((p, i) => {
                    const colors: Record<string, string> = {
                      VERB: "#dbeafe", NOUN: "#dcfce7", ADJ: "#fef9c3",
                      NUM: "#fce7f3", STOP: "#f1f5f9", OTHER: "#e2e8f0",
                    };
                    return (
                      <span key={i} style={{ background: colors[p.pos] ?? "#e2e8f0",
                        borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#334155" }}>
                        {p.token} <span style={{ opacity: 0.6 }}>{p.pos}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {c.snippets.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Docs relevantes (TF-IDF):
                </div>
                {c.snippets.slice(0, 2).map((sn, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#334155", marginBottom: 3, lineHeight: 1.5 }}>
                    <span style={{ color: "#2563eb", fontWeight: 700, marginRight: 4 }}>[{sn.score}]</span>
                    {sn.snippet}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (msg.esResultado) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 8px" }}>
          <div style={{ flex: 1, height: 1, background: "#cbd5e1" }} />
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: 2 }}>
            FIN DE CONSULTA
          </span>
          <div style={{ flex: 1, height: 1, background: "#cbd5e1" }} />
        </div>
        <div style={{
          border: `2px solid ${t.border}`, borderRadius: 16,
          padding: "4px 4px 12px", background: t.bg,
          boxShadow: `0 4px 16px ${t.border}33`,
        }}>
          <div style={{ fontSize: 10, color: t.border, fontWeight: 700, letterSpacing: 2,
            textAlign: "center", padding: "8px 0 4px" }}>
            RESULTADO FINAL
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px 4px", gap: 6 }}>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 1, fontWeight: 600, textAlign: "center" }}>
              {c && c.tipo === "pregunta_ciudad" ? "SIGUIENTE PASO" : "SEGÚN LOS PROTOCOLOS ACTUALES"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.border, textAlign: "center" }}>
              {t.emoji} {t.label}
            </div>
            {c && c.tipo === "pregunta_ciudad" && msg.texto.includes("\n\n") ? (
              <>
                <p style={{ margin: 0, fontSize: 15, color: "#0f172a", lineHeight: 1.8, fontWeight: 500, textAlign: "center", whiteSpace: "pre-line" }}>
                  {msg.texto.split("\n\n")[0]}
                </p>
                <div style={{
                  marginTop: 16,
                  backgroundColor: "white",
                  border: "2px solid #3b82f6",
                  borderRadius: 16,
                  padding: "16px 20px",
                  width: "100%",
                  boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.15)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8
                }}>
                  <div style={{ fontSize: 28 }}>📍</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1d4ed8", textAlign: "center", letterSpacing: 1 }}>
                    BUSCADOR DE CENTROS
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "#334155", textAlign: "center", lineHeight: 1.6, fontWeight: 500 }}>
                    {msg.texto.split("\n\n").slice(1).join("\n\n")}
                  </p>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 15, color: "#0f172a", lineHeight: 1.8, fontWeight: 500, textAlign: "center", whiteSpace: "pre-line" }}>
                {msg.texto}
              </p>
            )}
          </div>
          {c && (c.perplejidad > 0 || c.score_ir > 0 || c.entidades.length > 0 || c.pos.length > 0 || c.snippets.length > 0) && (
            <div style={{ padding: "0 16px" }}>
              <div style={{ borderTop: `1px solid ${t.border}22`, paddingTop: 8, marginTop: 4,
                display: "flex", gap: 10, alignItems: "center" }}>
                <button type="button" onClick={() => setDetalle(!detalle)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    fontSize: 11, color: "#64748b", padding: 0 }}>
                  {detalle ? "▲" : "▼"} análisis técnico
                </button>
                <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>
                  PP: {c.perplejidad} · IR: {c.score_ir} · {c.tiempo_ms}ms
                </span>
              </div>
              {detalle && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                  {c.entidades.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                        Entidades detectadas:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {c.entidades.map((e, i) => (
                          <span key={i} style={{ background: "#e0f2fe", border: "1px solid #7dd3fc",
                            borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#0369a1" }}>
                            {e.tipo}: <strong>{String(e.valor)}</strong>
                            {e.unidad ? ` ${e.unidad}` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {c.pos.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>POS:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {c.pos.map((p, i) => {
                          const colors: Record<string, string> = {
                            VERB: "#dbeafe", NOUN: "#dcfce7", ADJ: "#fef9c3",
                            NUM: "#fce7f3", STOP: "#f1f5f9", OTHER: "#e2e8f0",
                          };
                          return (
                            <span key={i} style={{ background: colors[p.pos] ?? "#e2e8f0",
                              borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#334155" }}>
                              {p.token} <span style={{ opacity: 0.6 }}>{p.pos}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {c.snippets.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                        Docs relevantes (TF-IDF):
                      </div>
                      {c.snippets.slice(0, 2).map((sn, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#334155", marginBottom: 3, lineHeight: 1.5 }}>
                          <span style={{ color: "#2563eb", fontWeight: 700, marginRight: 4 }}>[{sn.score}]</span>
                          {sn.snippet}
                        </div>
                      ))}
                    </div>
                  )}
                  {c.entidades.length === 0 && c.pos.length === 0 && c.snippets.length === 0 && (
                    <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                      Sin datos adicionales para esta consulta.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
      {avatar}
      {burbuja}
    </div>
  );
}

export function BotCargando() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "white",
        border: "1.5px solid #dc2626",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
        🩸
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: "4px 16px 16px 16px",
        padding: "10px 14px", fontSize: 13, color: "#94a3b8" }}>
        Analizando…
      </div>
    </div>
  );
}
