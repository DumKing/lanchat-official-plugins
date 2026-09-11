import { createBoard, reveal, toggleFlag, chord, progress } from "./minesweeper.js";
export function createSession(roomId, ownerPeerId, memberPeerIds, options = {}) {
  const settings = { width: options.width ?? 16, height: options.height ?? 16, mines: options.mines ?? 40, seed: options.seed ?? Date.now() };
  return { roomId, ownerPeerId, phase: "lobby", settings, players: Object.fromEntries([...new Set(memberPeerIds)].map((peerId) => [peerId, playerState(settings)])), winnerPeerId: null, startedAt: null, appliedEventKeys: [] };
}
export function applyEvent(state, event) {
  if (event.roomId !== state.roomId || event.gameId !== "minesweeper" || state.appliedEventKeys.includes(event.idempotencyKey)) return state;
  let next = state;
  if (event.type === "minesweeper.start" && event.senderPeerId === state.ownerPeerId && state.phase !== "playing") {
    const settings = { ...state.settings, ...(event.payload ?? {}), seed: event.payload?.seed ?? Date.now() };
    next = { ...state, settings, phase: "playing", startedAt: event.timestamp ?? Date.now(), winnerPeerId: null, players: Object.fromEntries(Object.keys(state.players).map((peerId) => [peerId, playerState(settings)])) };
  } else if (["minesweeper.reveal", "minesweeper.flag", "minesweeper.chord"].includes(event.type) && state.phase === "playing") {
    const current = state.players[event.senderPeerId] ?? playerState(state.settings);
    if (current.ended) return state;
    const action = event.type.endsWith("flag") ? toggleFlag(current.board, event.payload) : event.type.endsWith("chord") ? chord(current.board, event.payload) : reveal(current.board, event.payload);
    if (!action.changed) return state;
    const elapsedMs = Math.max(0, (event.timestamp ?? Date.now()) - state.startedAt);
    const player = { board: action.board, moves: current.moves + 1, ended: action.lost || action.won, lost: action.lost, won: action.won, elapsedMs, progress: progress(action.board) };
    next = { ...state, players: { ...state.players, [event.senderPeerId]: player }, winnerPeerId: state.winnerPeerId ?? (action.won ? event.senderPeerId : null), phase: action.won ? "ended" : state.phase };
  } else return state;
  return { ...next, appliedEventKeys: [...state.appliedEventKeys, event.idempotencyKey].slice(-1024) };
}
function playerState(settings) { const board = createBoard(settings); return { board, moves: 0, ended: false, lost: false, won: false, elapsedMs: 0, progress: progress(board) }; }
