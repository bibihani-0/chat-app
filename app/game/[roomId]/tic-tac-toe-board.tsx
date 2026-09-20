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
  state: { board?: (string | null)[] };
};

export default function TicTacToeBoard({
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

  const board = room.state?.board || Array(9).fill(null);
  const mySymbol = room.player_a === currentUserId ? "X" : "O";
  const isMyTurn = room.current_turn === currentUserId && room.status !== "finished";

  async function handleClick(index: number) {
    if (!isMyTurn || board[index] !== null) return;

    await fetch("/api/game/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, move: { cellIndex: index } }),
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
        @{playerAUsername} (X) vs @{playerBUsername} (O)
      </p>
      <p style={{ fontWeight: "bold", marginBottom: "16px" }}>{statusText}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 80px)",
          gridTemplateRows: "repeat(3, 80px)",
          gap: "6px",
          justifyContent: "center",
          margin: "0 auto",
        }}
      >
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!isMyTurn || cell !== null}
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              background: "#1e293b",
              border: "1px solid #334155",
              color: cell === "X" ? "#3b82f6" : "#f87171",
              cursor: isMyTurn && cell === null ? "pointer" : "default",
            }}
          >
            {cell}
          </button>
        ))}
      </div>

      <p style={{ color: "#64748b", marginTop: "16px" }}>You are: {mySymbol}</p>
    </div>
  );
}
