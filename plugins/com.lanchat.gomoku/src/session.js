import { createGomokuBoard, nextGomokuStone, placeGomokuStone } from "./gomoku.js";

export function createGomokuSession(roomId, ownerPeerId, memberPeerIds) {
  const members = [...new Set(memberPeerIds)].slice(0, 2);
  return {
    roomId,
    ownerPeerId,
    phase: "lobby",
    board: createGomokuBoard(),
    seats: members.map((peerId, index) => ({
      peerId,
      stone: index === 0 ? "black" : "white",
      ready: false,
    })),
    currentPeerId: null,
    winnerPeerId: null,
    winLine: [],
    draw: false,
    appliedEventKeys: [],
  };
}

export function applyGomokuEvent(state, event) {
  if (event.roomId !== state.roomId || event.gameId !== "gomoku") return state;
  if (state.appliedEventKeys.includes(event.idempotencyKey)) return state;

  let next = state;
  if (event.type === "gomoku.ready" && state.phase === "lobby") {
    const seatIndex = state.seats.findIndex((seat) => seat.peerId === event.senderPeerId);
    if (seatIndex < 0) return state;
    const seats = state.seats.map((seat, index) => index === seatIndex
      ? { ...seat, ready: event.payload?.ready === true }
      : seat);
    next = { ...state, seats };
  } else if (event.type === "gomoku.start" && canStart(state, event.senderPeerId)) {
    next = {
      ...state,
      phase: "playing",
      board: createGomokuBoard(),
      currentPeerId: state.seats.find((seat) => seat.stone === "black")?.peerId ?? null,
      winnerPeerId: null,
      winLine: [],
      draw: false,
    };
  } else if (event.type === "gomoku.move" && state.phase === "playing" && state.currentPeerId === event.senderPeerId) {
    const seat = state.seats.find((item) => item.peerId === event.senderPeerId);
    const point = normalizePoint(event.payload);
    if (!seat || !point) return state;
    const result = placeGomokuStone(state.board, point, seat.stone);
    if (!result.ok) return state;
    const winnerPeerId = result.winner ? seat.peerId : null;
    const nextStone = nextGomokuStone(seat.stone);
    next = {
      ...state,
      board: result.board,
      phase: winnerPeerId || result.draw ? "ended" : "playing",
      currentPeerId: winnerPeerId || result.draw
        ? null
        : state.seats.find((item) => item.stone === nextStone)?.peerId ?? null,
      winnerPeerId,
      winLine: result.winLine ?? [],
      draw: result.draw,
    };
  } else if (event.type === "gomoku.resign" && state.phase === "playing") {
    const loser = state.seats.find((seat) => seat.peerId === event.senderPeerId);
    if (!loser) return state;
    next = {
      ...state,
      phase: "ended",
      currentPeerId: null,
      winnerPeerId: state.seats.find((seat) => seat.peerId !== loser.peerId)?.peerId ?? null,
      draw: false,
    };
  } else if (event.type === "gomoku.restart" && state.phase === "ended" && event.senderPeerId === state.ownerPeerId) {
    next = createGomokuSession(state.roomId, state.ownerPeerId, state.seats.map((seat) => seat.peerId));
  } else {
    return state;
  }

  return {
    ...next,
    appliedEventKeys: [...state.appliedEventKeys, event.idempotencyKey].slice(-512),
  };
}

function canStart(state, senderPeerId) {
  return senderPeerId === state.ownerPeerId
    && state.seats.length === 2
    && state.seats.every((seat) => seat.ready);
}

function normalizePoint(payload) {
  const x = Number(payload?.x);
  const y = Number(payload?.y);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  return { x, y };
}
