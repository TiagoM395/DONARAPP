"use client";
import { useState, useEffect } from "react";
import { useIsMobile } from "./hooks/useIsMobile";
import { TabConsulta }  from "./components/tabs/TabConsulta";
import { TabDashboard } from "./components/tabs/TabDashboard";
import { TabNgramas }   from "./components/tabs/TabNgramas";
import { TabIR }        from "./components/tabs/TabIR";
import { TabWER }       from "./components/tabs/TabWER";
import { API }          from "./lib/api";

const TABS = [
  { id: "consulta"  as const, label: "🩸 Consulta" },
  { id: "dashboard" as const, label: "📊 Dashboard" },
  { id: "ngramas"   as const, label: "📈 N-gramas" },
  { id: "ir"        as const, label: "🔍 IR / TF-IDF" },
  { id: "wer"       as const, label: "📏 WER / ASR" },
];

const TOOLS = [
  { e: "🎤", t: "Google ASR", d: "Transcripción de voz en tiempo real con la Web Speech API del navegador." },
  { e: "🟣", t: "Whisper offline", d: "Transcripción local con IA (OpenAI). El audio no sale de tu servidor." },
  { e: "🔊", t: "TTS", d: "Convierte las respuestas a audio MP3 con gTTS (Google)." },
  { e: "📊", t: "N-gramas / Perplejidad", d: "Detecta si la consulta está dentro del dominio de donación de sangre." },
  { e: "🔍", t: "TF-IDF / IR", d: "Recupera documentos del corpus ordenados por relevancia (similitud coseno)." },
  { e: "📏", t: "WER", d: "Word Error Rate — evalúa la calidad de la transcripción ASR." },
];

function LoginForm({ onLogin }: { onLogin: (s: any) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al iniciar sesión");
      
      const sessionData = { token: data.access_token, role: data.rol, username };
      localStorage.setItem("session", JSON.stringify(sessionData));
      onLogin(sessionData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "Inter, system-ui, sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ background: "white", padding: 32, borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ margin: 0, textAlign: "center", color: "#0f172a" }}>Iniciar Sesión</h2>
        {error && <div style={{ color: "#ef4444", fontSize: 14, textAlign: "center", background: "#fef2f2", padding: 8, borderRadius: 6 }}>{error}</div>}
        <input placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 12, border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 15 }} />
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 12, border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 15 }} />
        <button type="submit" style={{ background: "#3b82f6", color: "white", border: "none", padding: 12, borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 15 }}>Ingresar</button>
      </form>
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState<{ token: string, role: string, username: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [tab, setTab] = useState<"consulta" | "dashboard" | "ngramas" | "ir" | "wer">("consulta");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("session");
    if (saved) setSession(JSON.parse(saved));
  }, []);

  if (!isClient) return null; // Evita el problema de "hydration mismatch" en Next.js
  if (!session) return <LoginForm onLogin={setSession} />;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "#f1f5f9", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <header style={{ background: "#0f172a", color: "white", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: isMobile ? "10px 16px" : "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 0 }}>

          {/* Brand */}
          <div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 16, letterSpacing: 0.3, flexShrink: 0,
                        padding: isMobile ? 0 : "14px 0" }}>
            🩸 DONAR-APP
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Tabs + Herramientas (Solo Admin) */}
            {session.role === "admin" && (
              <nav style={{ display: "flex", gap: 2, flexWrap: "wrap",
                justifyContent: isMobile ? "center" : "flex-end", alignItems: "center" }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    padding: isMobile ? "6px 10px" : "0 14px",
                    height: isMobile ? "auto" : 52,
                    fontSize: isMobile ? 11 : 13, color: tab === t.id ? "white" : "#94a3b8",
                    fontWeight: tab === t.id ? 700 : 400,
                    borderBottom: tab === t.id ? "2px solid #60a5fa" : "2px solid transparent",
                    transition: "all 0.15s",
                  }}>
                    {t.label}
                  </button>
                ))}
                <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)", margin: "0 6px" }} />
                <div
                  style={{ position: "relative" }}
                  onMouseEnter={() => setToolsOpen(true)}
                  onMouseLeave={() => { setToolsOpen(false); setHoveredTool(null); }}
                >
                  <button
                    onClick={() => setToolsOpen(v => !v)}
                    style={{ display: "flex", alignItems: "center", gap: 5,
                             background: toolsOpen ? "#334155" : "rgba(255,255,255,0.1)",
                             border: "1px solid rgba(255,255,255,0.2)",
                             borderRadius: 8, cursor: "pointer", padding: "5px 11px",
                             fontSize: 12, color: "#e2e8f0", fontWeight: 600,
                             transition: "all 0.15s" }}>
                    ⚙️ Herramientas
                    <span style={{ fontSize: 9, opacity: 0.6 }}>{toolsOpen ? "▲" : "▼"}</span>
                  </button>
                  {toolsOpen && (
                    <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 200,
                                  background: "white", borderRadius: 10, border: "1px solid #e2e8f0",
                                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)", width: 340, padding: "8px 0" }}>
                      {TOOLS.map((it, i) => (
                        <div key={i}
                          onMouseEnter={() => setHoveredTool(i)}
                          onMouseLeave={() => setHoveredTool(null)}
                          style={{ display: "flex", gap: 10, padding: "10px 16px",
                                   borderBottom: i < 5 ? "1px solid #f1f5f9" : "none",
                                   alignItems: "flex-start", cursor: "default",
                                   background: hoveredTool === i ? "#f0f9ff" : "transparent",
                                   transition: "background 0.12s" }}>
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{it.e}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12,
                                          color: hoveredTool === i ? "#0369a1" : "#0f172a",
                                          marginBottom: 2, transition: "color 0.12s" }}>{it.t}</div>
                            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{it.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </nav>
            )}
            
            {/* Botón Cerrar Sesión */}
            <button
              onClick={() => { localStorage.removeItem("session"); setSession(null); setTab("consulta"); }}
              style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)",
                       borderRadius: 8, cursor: "pointer", padding: "6px 12px",
                       fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ maxWidth: tab === "consulta" ? "none" : 1080, margin: "0 auto", flex: 1, width: "100%",
                     padding: tab === "consulta" ? (isMobile ? "8px" : "8px 4px") : (isMobile ? "20px 12px" : "28px 28px") }}>
        {tab === "consulta" && <TabConsulta isMobile={isMobile} />}
        {session.role === "admin" && tab === "dashboard" && <TabDashboard isMobile={isMobile} />}
        {session.role === "admin" && tab === "ngramas"   && <TabNgramas   isMobile={isMobile} />}
        {session.role === "admin" && tab === "ir"        && <TabIR        isMobile={isMobile} />}
        {session.role === "admin" && tab === "wer"       && <TabWER       isMobile={isMobile} />}
      </main>

      <footer style={{ background: "#0f172a", color: "#94a3b8", textAlign: "center",
                       fontSize: 12, padding: "14px 24px", lineHeight: 1.6, flexShrink: 0 }}>
        🩸 Instituto de Hemoterapia PBA · Sistema de Pre-evaluación de Donantes
        <span style={{ margin: "0 10px", opacity: 0.3 }}>|</span>
        Este cuestionario no reemplaza la evaluación médica presencial.
      </footer>
    </div>
  );
}
