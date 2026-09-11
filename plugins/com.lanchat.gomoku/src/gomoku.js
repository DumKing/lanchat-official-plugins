export const GOMOKU_BOARD_SIZE = 15;
export const GOMOKU_TURN_TIMEOUT_MS = 20_000;

const directions = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
];

export function createGomokuBoard(size = GOMOKU_BOARD_SIZE) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

export function cloneGomokuBoard(board) {
  return board.map((row) => [...row]);
}

export function nextGomokuStone(stone) {
  return stone === "black" ? "white" : "black";
}

export function isGomokuBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== null));
}

export function gomokuTurnRemainingSeconds(turnStartedAt, now = Date.now(), timeoutMs = GOMOKU_TURN_TIMEOUT_MS) {
  if (!turnStartedAt) return Math.ceil(timeoutMs / 1000);
  return Math.max(0, Math.ceil((timeoutMs - (now - turnStartedAt)) / 1000));
}

export function isGomokuTurnTimedOut(turnStartedAt, now = Date.now(), timeoutMs = GOMOKU_TURN_TIMEOUT_MS) {
  return gomokuTurnRemainingSeconds(turnStartedAt, now, timeoutMs) <= 0;
}

export function chooseAutoGomokuPoint(board) {
  const center = Math.floor(board.length / 2);
  const points = [];
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < (board[y]?.length ?? 0); x += 1) {
      if (!board[y]?.[x]) points.push({ x, y });
    }
  }
  points.sort((left, right) => {
    const leftDistance = Math.abs(left.x - center) + Math.abs(left.y - center);
    const rightDistance = Math.abs(right.x - center) + Math.abs(right.y - center);
    return leftDistance - rightDistance || left.y - right.y || left.x - right.x;
  });
  return points[0] ?? null;
}

export function placeGomokuStone(board, point, stone) {
  if (!isInsideBoard(board, point)) return { ok: false, board, error: "落子位置超出棋盘" };
  if (board[point.y]?.[point.x]) return { ok: false, board, error: "当前位置已有棋子" };

  const nextBoard = cloneGomokuBoard(board);
  nextBoard[point.y][point.x] = stone;
  const winLine = getGomokuWinLine(nextBoard, point);
  if (winLine) return { ok: true, board: nextBoard, winner: stone, winLine, draw: false };
  return { ok: true, board: nextBoard, draw: isGomokuBoardFull(nextBoard) };
}

export function getGomokuWinLine(board, point) {
  if (!isInsideBoard(board, point)) return null;
  const stone = board[point.y]?.[point.x];
  if (!stone) return null;
  for (const direction of directions) {
    const forward = collectDirection(board, point, direction.x, direction.y, stone);
    const backward = collectDirection(board, point, -direction.x, -direction.y, stone);
    const line = [...backward.reverse(), point, ...forward];
    if (line.length >= 5) return line;
  }
  return null;
}

function collectDirection(board, start, dx, dy, stone) {
  const points = [];
  let x = start.x + dx;
  let y = start.y + dy;
  while (isInsideBoard(board, { x, y }) && board[y]?.[x] === stone) {
    points.push({ x, y });
    x += dx;
    y += dy;
  }
  return points;
}

function isInsideBoard(board, point) {
  return point.y >= 0 && point.y < board.length && point.x >= 0 && point.x < (board[point.y]?.length ?? 0);
}
