"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Room = {
  id: string;
  player_a: string;
  player_b: string;
  current_turn: string | null;
  winner: string | null;
  status: string;
  state: { board?: (string | null)[][] };
};

export default function ConnectFourBoard({
  initialRoom,
  currentUserId,
  playerAUsername,
  playerBUsername,
}: {
  initialRoom: Room;
  currentUserId: string;
  playerAUsername: string;
  playerBUsername: string;
}) {
  const [room, setRoom] = useState(initialRoom);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${initialRoom.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${initialRoom.id}` },
        (payload) => setRoom(payload.new as Room)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialRoom.id]);

  const board = room.state?.board || Array.from({ length: 6 }, () => Array(7).fill(null));
  const mySymbol = room.player_a === currentUserId ? "R" : "Y";
  const isMyTurn = room.current_turn === currentUserId && room.status !== "finished";

  async function handleColumnClick(col: number) {
    if (!isMyTurn) return;
    await fetch("/api/game/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, move: { column: col } }),
    });
  }

  let statusText = "";
  if (room.status === "finished") {
    if (!room.winner) statusText = "It's a draw!";
    else if (room.winner === currentUserId) statusText = "You won! 🎉";
    else statusText = "You lost.";
  } else {
    statusText = isMyTurn ? "Your turn" : "Opponent's turn";
  }

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#94a3b8" }}>
        @{playerAUsername} (🔴) vs @{playerBUsername} (🟡)
      </p>
      <p style={{ fontWeight: "bold", marginBottom: "16px" }}>{statusText}</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "8px" }}>
        {Array.from({ length: 7 }).map((_, col) => (
          <button
            key={col}
            onClick={() => handleColumnClick(col)}
            disabled={!isMyTurn}
            style={{
              width: "44px",
              height: "28px",
              background: "#334155",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: isMyTurn ? "pointer" : "default",
            }}
          >
            ↓
          </button>
        ))}
      </div>

      <div
        style={{
          display: "inline-block",
          background: "#1e40af",
          padding: "8px",
          borderRadius: "8px",
        }}
      >
        {board.map((row, r) => (
          <div key={r} style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
            {row.map((cell, c) => (
              <div
                key={c}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: cell === "R" ? "#ef4444" : cell === "Y" ? "#eab308" : "#0f172a",
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <p style={{ color: "#64748b", marginTop: "16px" }}>
        You are: {mySymbol === "R" ? "🔴 Red" : "🟡 Yellow"}
      </p>
    </div>
  );
}
