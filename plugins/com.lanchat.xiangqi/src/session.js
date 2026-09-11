import { createBoard, movePiece, otherSide } from "./xiangqi.js";
export function createSession(roomId, ownerPeerId, memberPeerIds) {
  const members = [...new Set(memberPeerIds)].slice(0, 2);
  return { roomId, ownerPeerId, phase: "lobby", board: createBoard(), seats: members.map((peerId, i) => ({ peerId, side: i ? "black" : "red", ready: false })), currentSide: "red", winnerPeerId: null, appliedEventKeys: [] };
}
export function applyEvent(state, event) {
  if (event.roomId !== state.roomId || event.gameId !== "xiangqi" || state.appliedEventKeys.includes(event.idempotencyKey)) return state;
  let next = state;
  const seat = state.seats.find((item) => item.peerId === event.senderPeerId);
  if (event.type === "xiangqi.ready" && state.phase === "lobby" && seat) next = { ...state, seats: state.seats.map((item) => item.peerId === seat.peerId ? { ...item, ready: event.payload?.ready === true } : item) };
  else if (event.type === "xiangqi.start" && event.senderPeerId === state.ownerPeerId && state.seats.length === 2 && state.seats.every((item) => item.ready)) next = { ...state, phase: "playing", board: createBoard(), currentSide: "red", winnerPeerId: null };
  else if (event.type === "xiangqi.move" && state.phase === "playing" && seat?.side === state.currentSide) {
    const result = movePiece(state.board, event.payload?.from, event.payload?.to, seat.side);
    if (!result.ok) return state;
    next = { ...state, board: result.board, currentSide: otherSide(state.currentSide), phase: result.winner ? "ended" : "playing", winnerPeerId: result.winner ? seat.peerId : null };
  } else if (event.type === "xiangqi.resign" && state.phase === "playing" && seat) next = { ...state, phase: "ended", winnerPeerId: state.seats.find((item) => item.peerId !== seat.peerId)?.peerId ?? null };
  else if (event.type === "xiangqi.restart" && state.phase === "ended" && event.senderPeerId === state.ownerPeerId) next = createSession(state.roomId, state.ownerPeerId, state.seats.map((item) => item.peerId));
  else return state;
  return { ...next, appliedEventKeys: [...state.appliedEventKeys, event.idempotencyKey].slice(-512) };
}
