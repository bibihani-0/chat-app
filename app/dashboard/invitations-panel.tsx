"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Invitation = {
  id: string;
  sender_id: string;
  game_type: string;
  status: string;
  sender_username?: string;
};

export default function InvitationsPanel({ userId }: { userId: string }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadInvitations() {
      const { data } = await supabase
        .from("game_invitations")
        .select("id, sender_id, game_type, status")
        .eq("recipient_id", userId)
        .eq("status", "pending");

      if (data) {
        const withUsernames = await Promise.all(
          data.map(async (inv) => {
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", inv.sender_id)
              .single();
            return { ...inv, sender_username: senderProfile?.username };
          })
        );
        setInvitations(withUsernames);
      }
    }

    loadInvitations();

    const channel = supabase
      .channel(`invitations:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_invitations",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          loadInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function respond(invitationId: string, accept: boolean) {
    const res = await fetch("/api/invitations/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId, accept }),
    });
    const data = await res.json();

    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

    if (accept && data.roomId) {
      router.push(`/game/${data.roomId}`);
    }
  }

  if (invitations.length === 0) return null;

  return (
    <div style={{ marginBottom: "24px", background: "#1e293b", padding: "16px", borderRadius: "8px" }}>
      <h2 style={{ marginTop: 0, fontSize: "16px" }}>Game Invitations</h2>
      {invitations.map((inv) => (
        <div
          key={inv.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px",
            background: "#0f172a",
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        >
          <span>
            @{inv.sender_username} invited you to play <strong>{inv.game_type}</strong>
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => respond(inv.id, true)}
              style={{ padding: "6px 12px", background: "#22c55e", border: "none", borderRadius: "4px", color: "white", cursor: "pointer" }}
            >
              Accept
            </button>
            <button
              onClick={() => respond(inv.id, false)}
              style={{ padding: "6px 12px", background: "#ef4444", border: "none", borderRadius: "4px", color: "white", cursor: "pointer" }}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
