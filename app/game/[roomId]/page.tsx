import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TicTacToeBoard from "./tic-tac-toe-board";
import RPSBoard from "./rps-board";
import ConnectFourBoard from "./connect-four-board";
import MemoryBoard from "./memory-board";

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
    .select("*")
    .eq("id", roomId)
    .single();

  if (!room) {
    notFound();
  }

  const isPlayer = room.player_a === user.id || room.player_b === user.id;
  if (!isPlayer) {
    redirect("/dashboard");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", [room.player_a, room.player_b]);

  const playerAUsername = profiles?.find((p) => p.id === room.player_a)?.username || "Player A";
  const playerBUsername = profiles?.find((p) => p.id === room.player_b)?.username || "Player B";

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <a href="/dashboard" style={{ color: "#94a3b8" }}>← Back to Dashboard</a>

      <div style={{ marginTop: "24px" }}>
        {room.game_type === "tic-tac-toe" && (
          <TicTacToeBoard
            initialRoom={room}
            currentUserId={user.id}
            playerAUsername={playerAUsername}
            playerBUsername={playerBUsername}
          />
        )}

        {room.game_type === "rock-paper-scissors" && (
          <RPSBoard
            initialRoom={room}
            currentUserId={user.id}
            playerAUsername={playerAUsername}
            playerBUsername={playerBUsername}
          />
        )}

        {room.game_type === "connect-four" && (
          <ConnectFourBoard
            initialRoom={room}
            currentUserId={user.id}
            playerAUsername={playerAUsername}
            playerBUsername={playerBUsername}
          />
        )}

        {room.game_type === "memory" && (
          <MemoryBoard
            initialRoom={room}
            currentUserId={user.id}
            playerAUsername={playerAUsername}
            playerBUsername={playerBUsername}
          />
        )}
      </div>
    </main>
  );
}
