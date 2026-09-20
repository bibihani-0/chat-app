"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MessageButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/conversations/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.conversationId) {
      router.push(`/chat/${data.conversationId}`);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: "10px 20px",
        borderRadius: "6px",
        border: "none",
        background: "#3b82f6",
        color: "white",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      {loading ? "Opening..." : "Message"}
    </button>
  );
}
