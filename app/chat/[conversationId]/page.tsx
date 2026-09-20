import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessageInput from "./message-input";
import MessageList from "./message-list";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    notFound();
  }

  const isParticipant =
    conversation.participant_a === user.id || conversation.participant_b === user.id;

  if (!isParticipant) {
    redirect("/dashboard");
  }

  const otherUserId =
    conversation.participant_a === user.id
      ? conversation.participant_b
      : conversation.participant_a;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", otherUserId)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: "12px" }}>
        <a href="/dashboard" style={{ color: "#94a3b8" }}>←</a>
        <strong>@{otherProfile?.username || "Unknown"}</strong>
      </div>

      <MessageList
        conversationId={conversationId}
        currentUserId={user.id}
        initialMessages={messages || []}
      />

      <MessageInput conversationId={conversationId} senderId={user.id} />
    </main>
  );
}
