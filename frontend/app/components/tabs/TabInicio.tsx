"use client";
import React from "react";

interface TabInicioProps {
  setTab: (tab: "inicio" | "consulta" | "dashboard" | "ngramas" | "ir" | "wer") => void;
}

export function TabInicio({ setTab }: TabInicioProps) {
  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #c1ef44 0%, #3f991b 100%)",
        color: "white",
        padding: "48px 24px",
        borderRadius: "16px",
        textAlign: "center",
        marginBottom: "16px",
        boxShadow: "0 4px 20px rgba(239, 68, 68, 0.2)"
      }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "16px" }}>Donar Sangre es Donar Vida 🩸</h1>
        <p style={{ fontSize: "18px", opacity: 0.9, maxWidth: "700px", margin: "0 auto 32px", lineHeight: 1.5 }}>
          Un acto de 15 minutos puede salvar hasta tres vidas. La sangre no se fabrica, depende de la solidaridad de personas como vos.
        </p>
        <button
          onClick={() => setTab("consulta")}
          style={{
            background: "white",
            color: "#991b1b",
            border: "none",
            padding: "14px 32px",
            borderRadius: "50px",
            fontSize: "18px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            transition: "transform 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          ¿Puedo donar sangre? Consultar ahora →
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        {/* Información Básica */}
        <div style={cardStyle}>
          <h2 style={titleStyle}>📌 ¿Quiénes pueden donar?</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: "#475569", fontSize: "15px", lineHeight: 1.6 }}>
            <p>Cualquier persona que cumpla con estos requisitos básicos:</p>
            <ul style={{ paddingLeft: "20px" }}>
              <li>Tener entre <strong>16 y 65 años</strong>.</li>
              <li>Pesar más de <strong>50 kg</strong>.</li>
              <li>Sentirse <strong>bien de salud</strong> al momento de donar.</li>
              <li>Haber desayunado (sin grasas) y estar bien hidratado.</li>
              <li>Presentar <strong>DNI</strong> o documento que acredite identidad.</li>
            </ul>
          </div>
        </div>

        {/* Proceso */}
        <div style={cardStyle}>
          <h2 style={titleStyle}>🛡️ Un proceso seguro</h2>
          <div style={{ color: "#475569", fontSize: "15px", lineHeight: 1.6 }}>
            <p>Todo el material utilizado es <strong>100% estéril y descartable</strong>. No hay riesgo de contraer enfermedades por donar.</p>
            <p style={{ marginTop: "12px" }}>Antes de la extracción, pasarás por una entrevista médica confidencial para asegurar que la donación sea segura tanto para vos como para el receptor.</p>
          </div>
        </div>
      </div>

      {/* Mitos y Verdades */}
      <div style={cardStyle}>
        <h2 style={titleStyle}>💡 Mitos y Verdades</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {[
            { m: "Donar sangre engorda o debilita.", v: "Falso. No altera el peso y el volumen se recupera en pocas horas." },
            { m: "Tengo que estar en ayunas.", v: "Falso. Debés desayunar liviano (sin lácteos ni grasas) antes de ir." },
            { m: "Si tengo tatuajes no puedo donar.", v: "Realidad: Podés donar una vez pasados los 6 meses desde que te lo hiciste." },
            { m: "Donar sangre duele mucho.", v: "Realidad: Es solo un pinchazo momentáneo, igual que un análisis de rutina." }
          ].map((item, idx) => (
            <div key={idx} style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>🚩 Mito: {item.m}</div>
              <div style={{ color: "#10b981", fontWeight: 600, fontSize: "14px" }}>✨ Verdad: {item.v}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "16px", color: "#64748b", fontSize: "13px" }}>
        Fuente: Instituto de Hemoterapia de la Provincia de Buenos Aires.
      </footer>
    </div>
  );
}