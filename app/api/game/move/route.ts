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

function checkConnectFourWinner(board: (string | null)[][], row: number, col: number, symbol: string) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of directions) {
    let count = 1;
    for (let dir = -1; dir <= 1; dir += 2) {
      let r = row + dr * dir;
      let c = col + dc * dir;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === symbol) {
        count++;
        r += dr * dir;
        c += dc * dir;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

const EMOJIS = ["🐶", "🐱", "🐵", "🐸", "🐼", "🦊", "🐷", "🐰"];

function shuffledDeck() {
  const deck = [...EMOJIS, ...EMOJIS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
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
    }

    await supabase.from("game_rooms").update(updates).eq("id", roomId);
    return NextResponse.json({ success: true });
  }

  // ---- CONNECT FOUR ----
  if (room.game_type === "connect-four") {
    if (room.current_turn !== user.id) {
      return NextResponse.json({ error: "Not your turn" }, { status: 400 });
    }

    const { column } = move;
    const board: (string | null)[][] =
      room.state?.board || Array.from({ length: 6 }, () => Array(7).fill(null));

    if (column < 0 || column > 6) {
      return NextResponse.json({ error: "Invalid column" }, { status: 400 });
    }

    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (board[r][column] === null) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      return NextResponse.json({ error: "Column full" }, { status: 400 });
    }

    const symbol = room.player_a === user.id ? "R" : "Y";
    board[targetRow][column] = symbol;

    const won = checkConnectFourWinner(board, targetRow, column, symbol);
    const isDraw = !won && board.every((row) => row.every((cell) => cell !== null));
    const nextTurn = room.current_turn === room.player_a ? room.player_b : room.player_a;

    const updates: Record<string, unknown> = {
      state: { board },
      current_turn: won || isDraw ? room.current_turn : nextTurn,
    };

    if (won) {
      updates.status = "finished";
      updates.winner = user.id;
      updates.ended_at = new Date().toISOString();
    } else if (isDraw) {
      updates.status = "finished";
      updates.ended_at = new Date().toISOString();
    }

    await supabase.from("game_rooms").update(updates).eq("id", roomId);
    return NextResponse.json({ success: true });
  }

  // ---- MEMORY GAME ----
  if (room.game_type === "memory") {
    const { cardIndex } = move;

    const state = room.state || {};
    let cards: string[] = state.cards;
    if (!cards) cards = shuffledDeck();

    const revealed: boolean[] = state.revealed || Array(cards.length).fill(false);
    const matched: boolean[] = state.matched || Array(cards.length).fill(false);
    const currentFlips: number[] = state.currentFlips || [];

    if (room.current_turn !== user.id) {
      return NextResponse.json({ error: "Not your turn" }, { status: 400 });
    }

    if (matched[cardIndex] || revealed[cardIndex]) {
      return NextResponse.json({ error: "Invalid move" }, { status: 400 });
    }

    revealed[cardIndex] = true;
    const newFlips = [...currentFlips, cardIndex];

    let scores: Record<string, number> = state.scores || {
      [room.player_a]: 0,
      [room.player_b]: 0,
    };
    let nextTurn = room.current_turn;
    let finalRevealed = revealed;

    if (newFlips.length === 2) {
      const [i1, i2] = newFlips;
      if (cards[i1] === cards[i2]) {
        matched[i1] = true;
        matched[i2] = true;
        scores = { ...scores, [user.id]: (scores[user.id] || 0) + 1 };
      } else {
        finalRevealed = revealed.map((r, idx) => (idx === i1 || idx === i2 ? false : r));
        nextTurn = room.current_turn === room.player_a ? room.player_b : room.player_a;
      }
    }

    const allMatched = matched.every((m) => m);

    const updates: Record<string, unknown> = {
      state: {
        cards,
        revealed: newFlips.length === 2 ? finalRevealed : revealed,
        matched,
        currentFlips: newFlips.length === 2 ? [] : newFlips,
        scores,
      },
      current_turn: nextTurn,
    };

    if (allMatched) {
      updates.status = "finished";
      updates.ended_at = new Date().toISOString();
      const scoreA = scores[room.player_a] || 0;
      const scoreB = scores[room.player_b] || 0;
      if (scoreA > scoreB) updates.winner = room.player_a;
      else if (scoreB > scoreA) updates.winner = room.player_b;
    }

    await supabase.from("game_rooms").update(updates).eq("id", roomId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unsupported game type" }, { status: 400 });
}
