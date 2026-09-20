import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

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

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {profile?.display_name || profile?.username || user.email} 👋</p>
      <p style={{ color: "#94a3b8" }}>Logged in as {user.email}</p>
      <LogoutButton />
    </main>
  );
}
