"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Room = {
  id: string;
  player_a: string;
  player_b: string;
  winner: string | null;
  status: string;
  state: { choices?: Record<string, string> };
};

const OPTIONS = [
  { id: "rock", emoji: "🪨", label: "Rock" },
  { id: "paper", emoji: "📄", label: "Paper" },
  { id: "scissors", emoji: "✂️", label: "Scissors" },
];

export default function RPSBoard({
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
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${initialRoom.id}`,
        },
        (payload) => {
          setRoom(payload.new as Room);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialRoom.id]);

  const choices = room.state?.choices || {};
  const myChoice = choices[currentUserId];
  const opponentId = room.player_a === currentUserId ? room.player_b : room.player_a;
  const opponentChoice = choices[opponentId];
  const finished = room.status === "finished";

  async function handleChoice(choice: string) {
    if (myChoice || finished) return;
    await fetch("/api/game/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, move: { choice } }),
    });
  }

  let statusText = "Choose rock, paper, or scissors";
  if (finished) {
    if (!room.winner) statusText = "It's a draw!";
    else if (room.winner === currentUserId) statusText = "You won! 🎉";
    else statusText = "You lost.";
  } else if (myChoice) {
    statusText = "Waiting for opponent...";
  }

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#94a3b8" }}>
        @{playerAUsername} vs @{playerBUsername}
      </p>
      <p style={{ fontWeight: "bold", marginBottom: "16px" }}>{statusText}</p>

      {finished ? (
        <div style={{ display: "flex", justifyContent: "center", gap: "40px", fontSize: "48px" }}>
          <div>
            <div>{OPTIONS.find((o) => o.id === myChoice)?.emoji || "❓"}</div>
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>You</p>
          </div>
          <div>
            <div>{OPTIONS.find((o) => o.id === opponentChoice)?.emoji || "❓"}</div>
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>Opponent</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleChoice(opt.id)}
              disabled={!!myChoice}
              style={{
                fontSize: "40px",
                padding: "16px",
                background: myChoice === opt.id ? "#3b82f6" : "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                cursor: myChoice ? "default" : "pointer",
              }}
            >
              {opt.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
