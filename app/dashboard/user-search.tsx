"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
};

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(value: string) {
    setQuery(value);

    if (value.trim().length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .ilike("username", `%${value}%`)
      .limit(10);

    setResults(data || []);
    setLoading(false);
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <input
        style={styles.input}
        type="text"
        placeholder="Search @username..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {loading && <p style={{ color: "#94a3b8", fontSize: "14px" }}>Searching...</p>}

      {results.length > 0 && (
        <div style={styles.resultsBox}>
          {results.map((profile) => (
            <a
              key={profile.id}
              href={`/users/${profile.username}`}
              style={styles.resultItem}
            >
              <strong>@{profile.username}</strong>
              {profile.display_name && (
                <span style={{ color: "#94a3b8" }}> · {profile.display_name}</span>
              )}
            </a>
          ))}
        </div>
      )}

      {!loading && query.length > 0 && results.length === 0 && (
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>No users found.</p>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f1f5f9",
  },
  resultsBox: {
    marginTop: "8px",
    background: "#1e293b",
    borderRadius: "6px",
    overflow: "hidden",
  },
  resultItem: {
    display: "block",
    padding: "10px",
    color: "#f1f5f9",
    textDecoration: "none",
    borderBottom: "1px solid #334155",
  },
};
