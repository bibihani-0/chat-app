import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkTicTacToeWinner(board: (string | null)[]) {
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== null)) return "draw";
  return null;
}

function resolveRPS(choiceA: string, choiceB: string) {
  if (choiceA === choiceB) return "draw";
  const beats: Record<string, string> = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };
  return beats[choiceA] === choiceB ? "a" : "b";
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { roomId, move } = await request.json();

  const { data: room, error: roomError } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const isPlayer = room.player_a === user.id || room.player_b === user.id;
  if (!isPlayer) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (room.status === "finished") {
    return NextResponse.json({ error: "Game already finished" }, { status: 400 });
  }

  // ---- TIC-TAC-TOE ----
  if (room.game_type === "tic-tac-toe") {
    if (room.current_turn !== user.id) {
      return NextResponse.json({ error: "Not your turn" }, { status: 400 });
    }

    const { cellIndex } = move;
    const board = room.state?.board || Array(9).fill(null);

    if (cellIndex < 0 || cellIndex > 8 || board[cellIndex] !== null) {
      return NextResponse.json({ error: "Invalid move" }, { status: 400 });
    }

    const symbol = room.player_a === user.id ? "X" : "O";
    board[cellIndex] = symbol;

    const result = checkTicTacToeWinner(board);
    const nextTurn = room.current_turn === room.player_a ? room.player_b : room.player_a;

    const updates: Record<string, unknown> = {
      state: { board },
      current_turn: result ? room.current_turn : nextTurn,
    };

    if (result === "draw") {
      updates.status = "finished";
      updates.ended_at = new Date().toISOString();
    } else if (result) {
      updates.status = "finished";
      updates.winner = user.id;
      updates.ended_at = new Date().toISOString();
    }

    await supabase.from("game_rooms").update(updates).eq("id", roomId);

    return NextResponse.json({ success: true });
  }

  // ---- ROCK PAPER SCISSORS ----
  if (room.game_type === "rock-paper-scissors") {
    const { choice } = move;
    if (!["rock", "paper", "scissors"].includes(choice)) {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }

    const choices = room.state?.choices || {};
    choices[user.id] = choice;

    const updates: Record<string, unknown> = { state: { choices } };

    if (choices[room.player_a] && choices[room.player_b]) {
      const result = resolveRPS(choices[room.player_a], choices[room.player_b]);
      updates.status = "finished";
      updates.ended_at = new Date().toISOString();
      if (result === "a") updates.winner = room.player_a;
      else if (result === "b") updates.winner = room.player_b;
      // draw -> winner stays null
    }

    await supabase.from("game_rooms").update(updates).eq("id", roomId);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unsupported game type" }, { status: 400 });
}
