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
  state: {
    cards?: string[];
    revealed?: boolean[];
    matched?: boolean[];
    scores?: Record<string, number>;
  };
};

export default function MemoryBoard({
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

  const cards = room.state?.cards || [];
  const revealed = room.state?.revealed || [];
  const matched = room.state?.matched || [];
  const scores = room.state?.scores || {};
  const isMyTurn = room.current_turn === currentUserId && room.status !== "finished";

  async function handleCardClick(index: number) {
    if (!isMyTurn || revealed[index] || matched[index]) return;
    await fetch("/api/game/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, move: { cardIndex: index } }),
    });
  }

  let statusText = "";
  if (room.status === "finished") {
    if (!room.winner) statusText = "It's a draw!";
    else if (room.winner === currentUserId) statusText = "You won! 🎉";
    else statusText = "You lost.";
  } else {
    statusText = isMyTurn ? "Your turn — pick a card" : "Opponent's turn";
  }

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#94a3b8" }}>
        @{playerAUsername} ({scores[room.player_a] || 0}) vs @{playerBUsername} ({scores[room.player_b] || 0})
      </p>
      <p style={{ fontWeight: "bold", marginBottom: "16px" }}>{statusText}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 60px)",
          gap: "8px",
          justifyContent: "center",
          margin: "0 auto",
        }}
      >
        {cards.map((card, i) => {
          const isVisible = revealed[i] || matched[i];
          return (
            <button
              key={i}
              onClick={() => handleCardClick(i)}
              disabled={!isMyTurn || isVisible}
              style={{
                width: "60px",
                height: "60px",
                fontSize: "28px",
                background: matched[i] ? "#166534" : isVisible ? "#3b82f6" : "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                cursor: isMyTurn && !isVisible ? "pointer" : "default",
              }}
            >
              {isVisible ? card : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
