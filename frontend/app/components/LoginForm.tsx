import { useState } from "react";
import { API } from "../lib/api";

export function LoginForm({ onLogin }: { onLogin: (s: any) => void }) {
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