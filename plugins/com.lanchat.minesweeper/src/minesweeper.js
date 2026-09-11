export const DIFFICULTIES = [
  { key: "9x9-10", label: "初级 9×9", width: 9, height: 9, mines: 10 },
  { key: "16x16-40", label: "中级 16×16", width: 16, height: 16, mines: 40 },
  { key: "30x16-99", label: "高级 30×16", width: 30, height: 16, mines: 99 },
  { key: "32x32-160", label: "挑战 32×32", width: 32, height: 32, mines: 160 },
];
export function createBoard({ width = 16, height = 16, mines = 40, seed = Date.now() } = {}) {
  width = Math.max(4, Math.floor(width)); height = Math.max(4, Math.floor(height)); mines = Math.min(Math.max(1, mines), width * height - 1);
  const points = []; for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) points.push({ x, y });
  const random = seeded(seed); for (let i = points.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [points[i], points[j]] = [points[j], points[i]]; }
  return boardFromMines(width, height, points.slice(0, mines));
}
export function boardFromMines(width, height, mines) {
  const board = Array.from({ length: height }, () => Array.from({ length: width }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false })));
  for (const p of mines) if (inside(board, p)) board[p.y][p.x].mine = true;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) board[y][x].adjacent = neighbors(board, { x, y }).filter((p) => board[p.y][p.x].mine).length;
  return board;
}
export const cloneBoard = (board) => board.map((row) => row.map((cell) => ({ ...cell })));
export function reveal(board, point) {
  const next = cloneBoard(board); if (!inside(next, point)) return result(next, false, false); const cell = next[point.y][point.x]; if (cell.flagged || cell.revealed) return result(next, false, false);
  if (cell.mine) { cell.revealed = true; cell.exploded = true; revealMines(next); return result(next, true, true); }
  flood(next, point); return result(next, true, false);
}
export function toggleFlag(board, point) { const next = cloneBoard(board); if (!inside(next, point) || next[point.y][point.x].revealed) return result(next, false, false); next[point.y][point.x].flagged = !next[point.y][point.x].flagged; return result(next, true, false); }
export function chord(board, point) {
  const next = cloneBoard(board); if (!inside(next, point)) return result(next, false, false); const cell = next[point.y][point.x]; if (!cell.revealed || cell.adjacent <= 0) return result(next, false, false);
  const around = neighbors(next, point); if (around.filter((p) => next[p.y][p.x].flagged).length !== cell.adjacent) return result(next, false, false);
  let changed = false; for (const p of around) { const value = next[p.y][p.x]; if (value.revealed || value.flagged) continue; changed = true; if (value.mine) { value.revealed = true; value.exploded = true; revealMines(next); return result(next, true, true); } flood(next, p); }
  return result(next, changed, false);
}
export function progress(board) { let revealedSafe = 0, totalSafe = 0, flagged = 0; for (const row of board) for (const cell of row) { if (!cell.mine) totalSafe += 1; if (!cell.mine && cell.revealed) revealedSafe += 1; if (cell.flagged) flagged += 1; } return { revealedSafe, totalSafe, flagged }; }
const won = (board) => board.every((row) => row.every((cell) => cell.mine || cell.revealed));
const result = (board, changed, lost) => ({ ok: true, board, changed, lost, won: !lost && won(board) });
function flood(board, start) { const queue = [start], seen = new Set(); while (queue.length) { const p = queue.shift(), key = `${p.x}:${p.y}`; if (seen.has(key) || !inside(board, p)) continue; seen.add(key); const cell = board[p.y][p.x]; if (cell.revealed || cell.flagged || cell.mine) continue; cell.revealed = true; if (cell.adjacent === 0) queue.push(...neighbors(board, p)); } }
function revealMines(board) { for (const row of board) for (const cell of row) if (cell.mine) cell.revealed = true; }
function neighbors(board, point) { const out = []; for (let y = point.y - 1; y <= point.y + 1; y += 1) for (let x = point.x - 1; x <= point.x + 1; x += 1) if ((x !== point.x || y !== point.y) && inside(board, { x, y })) out.push({ x, y }); return out; }
const inside = (board, p) => Number.isInteger(p?.x) && Number.isInteger(p?.y) && p.y >= 0 && p.y < board.length && p.x >= 0 && p.x < (board[0]?.length ?? 0);
function seeded(seed) { let value = Math.floor(seed) >>> 0; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 0x100000000; }; }
