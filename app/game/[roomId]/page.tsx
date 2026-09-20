import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GameRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: room } = await supabase
    .from("game_rooms")
    .select("id, game_type, player_a, player_b, status")
    .eq("id", roomId)
    .single();

  if (!room) {
    notFound();
  }

  const isPlayer = room.player_a === user.id || room.player_b === user.id;
  if (!isPlayer) {
    redirect("/dashboard");
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center" }}>
      <a href="/dashboard" style={{ color: "#94a3b8" }}>← Back to Dashboard</a>
      <h1 style={{ marginTop: "24px" }}>{room.game_type}</h1>
      <p style={{ color: "#94a3b8" }}>Room ID: {room.id}</p>
      <p style={{ color: "#4ade80" }}>Room created ✅ — game board coming in the next phase!</p>
    </main>
  );
}
