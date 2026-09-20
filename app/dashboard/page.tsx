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

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b")
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  let recentChats: { id: string; username: string }[] = [];

  if (conversations && conversations.length > 0) {
    const otherIds = conversations.map((c) =>
      c.participant_a === user.id ? c.participant_b : c.participant_a
    );

    const { data: otherProfiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", otherIds);

    recentChats = conversations.map((c) => {
      const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
      const otherProfile = otherProfiles?.find((p) => p.id === otherId);
      return { id: c.id, username: otherProfile?.username || "Unknown" };
    });
  }

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
        {recentChats.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentChats.map((chat) => (
              <a
                key={chat.id}
                href={`/chat/${chat.id}`}
                style={{
                  padding: "10px",
                  background: "#0f172a",
                  borderRadius: "6px",
                  color: "#f1f5f9",
                  textDecoration: "none",
                }}
              >
                @{chat.username}
              </a>
            ))}
          </div>
        ) : (
          <p style={{ color: "#94a3b8" }}>No conversations yet. Search a user to start chatting.</p>
        )}
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
