"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MessageInput({
  conversationId,
  senderId,
}: {
  conversationId: string;
  senderId: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    const supabase = createClient();

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: text.trim(),
    });

    setText("");
    setSending(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSend} style={{ display: "flex", gap: "8px", padding: "12px", borderTop: "1px solid #334155" }}>
      <input
        style={{
          flex: 1,
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #334155",
          background: "#0f172a",
          color: "#f1f5f9",
        }}
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        disabled={sending}
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
        Send
      </button>
    </form>
  );
}
