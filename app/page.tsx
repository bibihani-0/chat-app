export default function Home() {
  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <h1>Chat & Games App</h1>
      <p>Phase 02: Authentication is working ✅</p>
      <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
        <a
          href="/signup"
          style={{
            padding: "10px 20px",
            background: "#3b82f6",
            color: "white",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Sign Up
        </a>
        <a
          href="/login"
          style={{
            padding: "10px 20px",
            background: "#334155",
            color: "white",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Log In
        </a>
      </div>
    </main>
  );
}
