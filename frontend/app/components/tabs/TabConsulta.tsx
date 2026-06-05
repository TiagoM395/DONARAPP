"use client";
import { useState, useRef, useEffect } from "react";
import { useChatFlow } from "../../hooks/useChatFlow";
import { BotBurbuja } from "../chat/BotBurbuja";
import { UsuarioBurbuja } from "../chat/UsuarioBurbuja";
import { playTTS } from "../../lib/api";
import type { FaseChat } from "../../types";

const FASES_CON_TEXTO = new Set<FaseChat>([
  "pedir_peso", "pedir_edad",
  "q_ultima_donacion", "q_salud_cual",
  "q_medicacion_cual", "q_vacuna_cual",
  "q_enfermedades_cual", "q_diabetes_tipo",
  "pedir_ciudad",
  "q_frecuencia_donacion", "q_embarazo",
  "q_salud_general", "q_medicacion",
  "q_vacunas", "q_enfermedades",
  "q_odontologo", "q_tatuajes_procedimientos",
]);

const FASES_SI_NO = new Set<FaseChat>([
  "confirmar_inicio",
]);

function InputArea({ chat }: { chat: ReturnType<typeof useChatFlow> }) {
  const { fase, input, setInput, inputError, setInputError, loading, manejarEnvio } = chat;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && FASES_CON_TEXTO.has(fase)) {
      inputRef.current?.focus();
    }
  }, [loading, fase]);

  if (fase === "pedir_sexo") return (
    <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid #cbd5e1" }}>
      {(["Masculino", "Femenino", "Otro"] as const).map(s => (
        <button key={s}
          onClick={() => chat.procesarSexo(s === "Masculino" ? "Hombre" : s === "Femenino" ? "Mujer" : "Otro")}
          style={{ flex: 1, padding: "12px 4px", borderRadius: 8,
                   border: "2px solid #3b82f6", background: "#eff6ff",
                   cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#1e40af" }}>
          {s}
        </button>
      ))}
    </div>
  );

  if (fase === "resultado") return (
    <div style={{ display: "flex", justifyContent: "center", padding: "12px 16px", borderTop: "1px solid #cbd5e1" }}>
      <button onClick={chat.reiniciar}
        style={{ padding: "10px 24px", borderRadius: 8, border: "none",
                 background: "#0f172a", color: "white", cursor: "pointer",
                 fontSize: 14, fontWeight: 600 }}>
        Nueva evaluación
      </button>
    </div>
  );

  if (FASES_SI_NO.has(fase)) return (
    <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid #cbd5e1" }}>
      {["Sí", "No"].map(op => (
        <button key={op} onClick={() => manejarEnvio(op)}
          style={{ flex: 1, padding: "12px 4px", borderRadius: 8,
                   border: op === "Sí" ? "2px solid #16a34a" : "2px solid #94a3b8",
                   background: op === "Sí" ? "#f0fdf4" : "#f8fafc",
                   cursor: "pointer", fontSize: 15, fontWeight: 700,
                   color: op === "Sí" ? "#14532d" : "#334155" }}>
          {op}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "12px 16px",
                  borderTop: "1px solid #cbd5e1", gap: 6 }}>
      {inputError && <div style={{ fontSize: 12, color: "#dc2626" }}>{inputError}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={input}
          onChange={e => { setInput(e.target.value); setInputError(""); }}
          onKeyDown={e => { if (e.key === "Enter" && !loading) manejarEnvio(input); }}
          placeholder={chat.placeholder} disabled={loading}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8,
                   border: inputError ? "1px solid #dc2626" : "1px solid #cbd5e1",
                   fontSize: 14, outline: "none" }} />
        <button onClick={() => manejarEnvio(input)} disabled={loading || !input.trim()}
          style={{ padding: "10px 16px", borderRadius: 8, border: "none",
                   background: "#0f172a", color: "white", cursor: "pointer",
                   opacity: loading || !input.trim() ? 0.5 : 1 }}>
          ➤
        </button>
      </div>
    </div>
  );
}

export function TabConsulta({ isMobile: _isMobile }: { isMobile: boolean }) {
  const texto = useChatFlow({ autoTts: false, bienvenida: "Este es el asistente para evaluaciones de posibles donantes.\n\n¿Querés comenzar con el asistente de texto para la evaluación de posibles donantes?" });
  const voz   = useChatFlow({ autoTts: true,  bienvenida: "Este es el asistente para evaluaciones de posibles donantes.\n\n¿Querés comenzar con el asistente de voz para la evaluación de posibles donantes? Podés responder todas las preguntas hablando.", modo: "voz" });
  const [activePanel, setActivePanel] = useState<"texto" | "voz">("texto");

  const GAP = 16;

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      gap: GAP,
      height: "calc(100vh - 120px)",
      width: "70vw",
      margin: "0 auto",
    }}>

      {/* Panel Texto */}
      <div
        onClick={() => activePanel !== "texto" && setActivePanel("texto")}
        style={{
          flex: activePanel === "texto" ? 7 : 3,
          transition: "all 0.5s ease-in-out",
          minWidth: 0,
          display: "flex", flexDirection: "column",
          borderRadius: 14,
          border: "2px solid #3b82f6",
          background: activePanel === "texto" ? "white" : "#dbeafe",
          overflow: "hidden",
          boxShadow: activePanel === "texto" ? "0 4px 20px rgba(59,130,246,0.15)" : "0 2px 8px rgba(59,130,246,0.12)",
          cursor: activePanel !== "texto" ? "pointer" : "default",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 16px",
                      borderBottom: activePanel === "texto" ? "2px solid #dbeafe" : "1px solid #e2e8f0",
                      background: activePanel === "texto" ? "#eff6ff" : "#e9eef5",
                      flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <span style={{ fontWeight: 700, fontSize: activePanel === "texto" ? 15 : 13,
                           color: activePanel === "texto" ? "#1e40af" : "#475569" }}>
              Asistente de texto
            </span>
          </div>
          {activePanel === "texto" && (
            <button onClick={e => { e.stopPropagation(); texto.reiniciar(); }} title="Reiniciar"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>
              🔄
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: activePanel !== "texto" ? "hidden" : "auto", padding: "16px" }}>
          {activePanel !== "texto" ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                          textAlign: "center", color: "#1e40af", fontWeight: 600, lineHeight: 1.6, fontSize: 13, fontStyle: "italic" }}>
              Este es el asistente para evaluaciones de posibles donantes por medio de texto.
            </div>
          ) : (
            <>
              {texto.mensajes.map(m =>
                m.rol === "bot"
                  ? <BotBurbuja key={m.id} msg={m} onOpcion={op => texto.manejarEnvio(op)} onTTS={() => {}} showTts={false} />
                  : <UsuarioBurbuja key={m.id} texto={m.texto} />
              )}
              {texto.loading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 8 }}>
                  <div style={{ background: "#f1f5f9", borderRadius: 12, padding: "10px 14px",
                                fontSize: 13, color: "#64748b" }}>Procesando...</div>
                </div>
              )}
              <div ref={texto.chatEndRef} />
            </>
          )}
        </div>
        <InputArea chat={texto} />
      </div>

      {/* Panel Voz */}
      <div
        onClick={() => activePanel !== "voz" && setActivePanel("voz")}
        style={{
          flex: activePanel === "voz" ? 7 : 3,
          transition: "all 0.5s ease-in-out",
          minWidth: 0,
          display: "flex", flexDirection: "column",
          borderRadius: 14,
          border: "2px solid #7c3aed",
          background: activePanel === "voz" ? "white" : "#ede9fe",
          overflow: "hidden",
          boxShadow: activePanel === "voz" ? "0 4px 20px rgba(124,58,237,0.15)" : "0 2px 8px rgba(124,58,237,0.15)",
          cursor: activePanel !== "voz" ? "pointer" : "default",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 16px",
                      borderBottom: activePanel === "voz" ? "2px solid #ede9fe" : "1px solid #e2e8f0",
                      background: activePanel === "voz" ? "#f5f3ff" : "#e9eef5",
                      flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎙️</span>
            <span style={{ fontWeight: 700, fontSize: activePanel === "voz" ? 15 : 13,
                           color: activePanel === "voz" ? "#5b21b6" : "#475569" }}>
              Asistente de voz
            </span>
          </div>
          {activePanel === "voz" && (
            <button type="button" onClick={e => { e.stopPropagation(); voz.reiniciar(); }} title="Reiniciar"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>
              🔄
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: activePanel !== "voz" ? "hidden" : "auto", padding: "16px" }}>
          {activePanel !== "voz" ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                          textAlign: "center", color: "#5b21b6", fontWeight: 600, lineHeight: 1.6, fontSize: 13, fontStyle: "italic" }}>
              Este es el asistente para evaluaciones de posibles donantes por medio de tu voz
            </div>
          ) : (
            <>
              {voz.mensajes.map(m =>
                m.rol === "bot"
                  ? <BotBurbuja key={m.id} msg={m} onOpcion={op => voz.manejarEnvio(op)} onTTS={() => playTTS(m.texto)} />
                  : <UsuarioBurbuja key={m.id} texto={m.texto} />
              )}
              {voz.loading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 8 }}>
                  <div style={{ background: "#f1f5f9", borderRadius: 12, padding: "10px 14px",
                                fontSize: 13, color: "#64748b" }}>Procesando...</div>
                </div>
              )}
              <div ref={voz.chatEndRef} />
            </>
          )}
        </div>
        <div style={{ padding: "16px", borderTop: "2px solid #e2e8f0",
                      display: "flex", flexDirection: "column", gap: 10, alignItems: "center",
                      flexShrink: 0 }}>
          {voz.fase !== "resultado" && (
            <>
              <button onClick={e => { if (activePanel !== "voz") return; e.stopPropagation(); voz.iniciarVoz(); }}
                style={{ width: 68, height: 68, borderRadius: "50%", border: "none",
                         cursor: "pointer",
                         background: voz.escuchando ? "#dc2626" : "#0f172a",
                         color: "white", fontSize: 28,
                         display: "flex", alignItems: "center", justifyContent: "center",
                         boxShadow: voz.escuchando
                           ? "0 0 0 10px #fecaca, 0 2px 8px rgba(0,0,0,0.2)"
                           : "0 4px 12px rgba(0,0,0,0.25)" }}>
                🎙️
              </button>
              <span style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
                {voz.escuchando ? "Escuchando... tocá para detener" : "Tocá para hablar"}
              </span>
            </>
          )}
          {voz.fase === "resultado" && (
            <button onClick={e => { e.stopPropagation(); voz.reiniciar(); }}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none",
                       background: "#0f172a", color: "white", cursor: "pointer",
                       fontSize: 14, fontWeight: 600 }}>
              Nueva evaluación
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); voz.setTtsOn(!voz.ttsOn); }}
            style={{ background: voz.ttsOn ? "#0f172a" : "#f1f5f9",
                     color: voz.ttsOn ? "white" : "#64748b",
                     border: "1px solid #cbd5e1", borderRadius: 20, padding: "5px 14px",
                     cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {voz.ttsOn ? "🔊 Voz activada" : "🔇 Voz silenciada"}
          </button>
        </div>
      </div>
    </div>
  );
}
