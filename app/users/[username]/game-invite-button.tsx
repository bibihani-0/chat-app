"use client";

import { useState } from "react";

const GAMES = [
  { id: "tic-tac-toe", label: "Tic-Tac-Toe" },
  { id: "rock-paper-scissors", label: "Rock Paper Scissors" },
  { id: "connect-four", label: "Connect Four" },
  { id: "memory", label: "Memory Game" },
];

export default function GameInviteButton({ recipientId }: { recipientId: string }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendInvite(gameType: string) {
    setSending(true);
    await fetch("/api/invitations/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, gameType }),
    });
    setSending(false);
    setSent(true);
    setOpen(false);
  }

  if (sent) {
    return <p style={{ color: "#4ade80", margin: 0 }}>Invitation sent! ✅</p>;
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "10px 20px",
          borderRadius: "6px",
          border: "none",
          background: "#8b5cf6",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Play Game
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            background: "#1e293b",
            borderRadius: "8px",
            overflow: "hidden",
            minWidth: "200px",
            zIndex: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => sendInvite(game.id)}
              disabled={sending}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                color: "white",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {game.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
