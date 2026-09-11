export const FILES = 9;
export const RANKS = 10;

export function createBoard() {
  const board = Array.from({ length: RANKS }, () => Array(FILES).fill(null));
  const place = (x, y, side, kind, id) => { board[y][x] = { id, side, kind }; };
  const back = ["rook", "horse", "elephant", "advisor", "general", "advisor", "elephant", "horse", "rook"];
  for (const side of ["black", "red"]) {
    const y = side === "black" ? 0 : 9;
    back.forEach((kind, x) => place(x, y, side, kind, `${side}-${kind}-${x}`));
    const cannonY = side === "black" ? 2 : 7;
    place(1, cannonY, side, "cannon", `${side}-cannon-1`);
    place(7, cannonY, side, "cannon", `${side}-cannon-7`);
    const soldierY = side === "black" ? 3 : 6;
    for (const x of [0, 2, 4, 6, 8]) place(x, soldierY, side, "soldier", `${side}-soldier-${x}`);
  }
  return board;
}

export const cloneBoard = (board) => board.map((row) => row.map((piece) => piece ? { ...piece } : null));
export const otherSide = (side) => side === "red" ? "black" : "red";
export function pieceLabel(piece) {
  const labels = { general: piece?.side === "black" ? "将" : "帅", advisor: piece?.side === "black" ? "士" : "仕", elephant: piece?.side === "black" ? "象" : "相", horse: "马", rook: "车", cannon: "炮", soldier: piece?.side === "black" ? "卒" : "兵" };
  return labels[piece?.kind] ?? "";
}

export function movePiece(board, from, to, side) {
  if (!isLegalMove(board, from, to, side)) return { ok: false, board, error: "不符合中国象棋走法" };
  const next = cloneBoard(board);
  const piece = next[from.y][from.x];
  const captured = next[to.y][to.x] ?? undefined;
  next[to.y][to.x] = piece;
  next[from.y][from.x] = null;
  if (captured?.kind === "general") return { ok: true, board: next, captured, winner: side, check: false };
  const opponent = otherSide(side);
  const check = isGeneralInCheck(next, opponent);
  return { ok: true, board: next, captured, winner: check && !hasLegalMove(next, opponent) ? side : undefined, check };
}

export function isLegalMove(board, from, to, side) {
  if (![from, to].every(inside) || from.x === to.x && from.y === to.y) return false;
  const piece = board[from.y]?.[from.x];
  const target = board[to.y]?.[to.x];
  if (!piece || piece.side !== side || target?.side === side || !rawLegal(board, from, to, piece)) return false;
  const next = cloneBoard(board);
  next[to.y][to.x] = { ...piece };
  next[from.y][from.x] = null;
  if (target?.kind === "general") return true;
  return !generalsFace(next) && !isGeneralInCheck(next, side);
}

export function isGeneralInCheck(board, side) {
  const point = findGeneral(board, side);
  if (!point) return false;
  for (let y = 0; y < RANKS; y += 1) for (let x = 0; x < FILES; x += 1) {
    const piece = board[y][x];
    if (piece?.side === otherSide(side) && rawLegal(board, { x, y }, point, piece)) return true;
  }
  return false;
}

export function hasLegalMove(board, side) {
  for (let fy = 0; fy < RANKS; fy += 1) for (let fx = 0; fx < FILES; fx += 1) {
    if (board[fy][fx]?.side !== side) continue;
    for (let ty = 0; ty < RANKS; ty += 1) for (let tx = 0; tx < FILES; tx += 1) if (isLegalMove(board, { x: fx, y: fy }, { x: tx, y: ty }, side)) return true;
  }
  return false;
}

function rawLegal(board, from, to, piece) {
  const dx = to.x - from.x, dy = to.y - from.y, ax = Math.abs(dx), ay = Math.abs(dy), target = board[to.y]?.[to.x];
  if (piece.kind === "general") return Boolean(target?.kind === "general" && from.x === to.x && between(board, from, to) === 0 || palace(to, piece.side) && ax + ay === 1);
  if (piece.kind === "advisor") return palace(to, piece.side) && ax === 1 && ay === 1;
  if (piece.kind === "elephant") return ax === 2 && ay === 2 && !crossesRiver(to, piece.side) && !board[from.y + dy / 2][from.x + dx / 2];
  if (piece.kind === "horse") return (ax === 1 && ay === 2 || ax === 2 && ay === 1) && !(ax === 2 ? board[from.y][from.x + dx / 2] : board[from.y + dy / 2][from.x]);
  if (piece.kind === "rook") return straight(from, to) && between(board, from, to) === 0;
  if (piece.kind === "cannon") return straight(from, to) && between(board, from, to) === (target ? 1 : 0);
  if (piece.kind === "soldier") { const forward = piece.side === "red" ? -1 : 1; return dx === 0 && dy === forward || crossed(from, piece.side) && ax === 1 && dy === 0; }
  return false;
}
const inside = (p) => Number.isInteger(p?.x) && Number.isInteger(p?.y) && p.x >= 0 && p.x < FILES && p.y >= 0 && p.y < RANKS;
const straight = (a, b) => a.x === b.x || a.y === b.y;
function between(board, a, b) { if (!straight(a, b)) return Infinity; const sx = Math.sign(b.x - a.x), sy = Math.sign(b.y - a.y); let x = a.x + sx, y = a.y + sy, count = 0; while (x !== b.x || y !== b.y) { if (board[y][x]) count += 1; x += sx; y += sy; } return count; }
const palace = (p, side) => p.x >= 3 && p.x <= 5 && p.y >= (side === "red" ? 7 : 0) && p.y <= (side === "red" ? 9 : 2);
const crossesRiver = (p, side) => side === "red" ? p.y < 5 : p.y > 4;
const crossed = (p, side) => side === "red" ? p.y <= 4 : p.y >= 5;
function findGeneral(board, side) { for (let y = 0; y < RANKS; y += 1) for (let x = 0; x < FILES; x += 1) if (board[y][x]?.side === side && board[y][x].kind === "general") return { x, y }; return null; }
function generalsFace(board) { const red = findGeneral(board, "red"), black = findGeneral(board, "black"); return Boolean(red && black && red.x === black.x && between(board, red, black) === 0); }
