"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main style={styles.main}>
      <form onSubmit={handleSignup} style={styles.form}>
        <h1 style={styles.title}>Create Account</h1>

        <input
          style={styles.input}
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
        />
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p style={styles.link}>
          Already have an account? <a href="/login">Log in</a>
        </p>
      </form>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "320px",
    padding: "32px",
    background: "#1e293b",
    borderRadius: "12px",
  },
  title: { marginBottom: "8px" },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f1f5f9",
  },
  button: {
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  error: { color: "#f87171", fontSize: "14px" },
  link: { fontSize: "14px", textAlign: "center" },
};
