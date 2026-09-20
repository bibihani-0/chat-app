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

  const { invitationId, accept } = await request.json();

  const { data: invitation, error: fetchError } = await supabase
    .from("game_invitations")
    .select("*")
    .eq("id", invitationId)
    .single();

  if (fetchError || !invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  if (invitation.recipient_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (!accept) {
    await supabase
      .from("game_invitations")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", invitationId);

    return NextResponse.json({ status: "declined" });
  }

  // Create the game room
  const { data: room, error: roomError } = await supabase
    .from("game_rooms")
    .insert({
      game_type: invitation.game_type,
      player_a: invitation.sender_id,
      player_b: invitation.recipient_id,
      current_turn: invitation.sender_id,
      state: {},
    })
    .select("id")
    .single();

  if (roomError) {
    return NextResponse.json({ error: roomError.message }, { status: 500 });
  }

  await supabase
    .from("game_invitations")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
      room_id: room.id,
    })
    .eq("id", invitationId);

  return NextResponse.json({ roomId: room.id });
}
