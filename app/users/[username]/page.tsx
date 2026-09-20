import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = profile.id === user.id;

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "500px", margin: "0 auto" }}>
      <a href="/dashboard" style={{ color: "#94a3b8" }}>← Back to Dashboard</a>

      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginTop: "16px" }}>
        <h1>@{profile.username}</h1>
        {profile.display_name && <p style={{ color: "#cbd5e1" }}>{profile.display_name}</p>}
        {profile.bio && <p style={{ color: "#94a3b8" }}>{profile.bio}</p>}

        {!isOwnProfile && (
          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button style={styles.button}>Message</button>
            <button style={{ ...styles.button, background: "#8b5cf6" }}>Play Game</button>
          </div>
        )}

        {isOwnProfile && (
          <p style={{ color: "#94a3b8", marginTop: "16px" }}>This is your own profile.</p>
        )}
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  button: {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
