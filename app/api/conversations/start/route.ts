import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { targetUserId } = await request.json();

  if (!targetUserId || targetUserId === user.id) {
    return NextResponse.json({ error: "Invalid target user" }, { status: 400 });
  }

  // Order the two IDs consistently so unique constraint works both ways
  const [a, b] = [user.id, targetUserId].sort();

  // Try to find existing conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  // Create new conversation
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ participant_a: a, participant_b: b })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversationId: created.id });
}
