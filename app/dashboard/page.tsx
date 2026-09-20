import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";
import UserSearch from "./user-search";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: "#94a3b8" }}>
            Welcome, {profile?.display_name || profile?.username || user.email} 👋
          </p>
        </div>
        <LogoutButton />
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statNumber}>{totalUsers ?? 0}</p>
          <p style={styles.statLabel}>Total Users</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNumber}>@{profile?.username}</p>
          <p style={styles.statLabel}>Your Username</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Search Users</h2>
        <UserSearch />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Chats</h2>
        <p style={{ color: "#94a3b8" }}>No conversations yet. Search a user to start chatting.</p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Available Games</h2>
        <p style={{ color: "#94a3b8" }}>Coming soon: Tic-Tac-Toe, Rock Paper Scissors, Connect Four, Memory Game</p>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    padding: "2rem",
    fontFamily: "sans-serif",
    maxWidth: "700px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#1e293b",
    padding: "16px",
    borderRadius: "8px",
    flex: 1,
  },
  statNumber: { fontSize: "24px", fontWeight: "bold", margin: 0 },
  statLabel: { color: "#94a3b8", margin: 0, fontSize: "14px" },
  section: {
    marginBottom: "24px",
    background: "#1e293b",
    padding: "16px",
    borderRadius: "8px",
  },
  sectionTitle: { marginTop: 0, fontSize: "16px" },
};
