export function UsuarioBurbuja({ texto }: { texto: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        background: "#0f172a", color: "white",
        borderRadius: "16px 16px 4px 16px",
        padding: "10px 14px", maxWidth: "78%", fontSize: 14, lineHeight: 1.5,
      }}>
        {texto}
      </div>
    </div>
  );
}
