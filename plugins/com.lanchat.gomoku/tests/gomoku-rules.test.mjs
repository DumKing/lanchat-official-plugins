import test from "node:test";
import assert from "node:assert/strict";
import {
  GOMOKU_BOARD_SIZE,
  chooseAutoGomokuPoint,
  createGomokuBoard,
  gomokuTurnRemainingSeconds,
  isGomokuTurnTimedOut,
  nextGomokuStone,
  placeGomokuStone,
} from "../src/gomoku.js";

test("创建标准棋盘且自动落子优先中心", () => {
  const board = createGomokuBoard();
  assert.equal(board.length, GOMOKU_BOARD_SIZE);
  assert.equal(board.every((row) => row.length === GOMOKU_BOARD_SIZE), true);
  assert.deepEqual(chooseAutoGomokuPoint(board), { x: 7, y: 7 });
});

test("落子不修改源棋盘并拒绝重复位置", () => {
  const board = createGomokuBoard();
  const first = placeGomokuStone(board, { x: 7, y: 7 }, "black");
  assert.equal(first.ok, true);
  assert.equal(board[7][7], null);
  assert.equal(first.board[7][7], "black");
  assert.equal(placeGomokuStone(first.board, { x: 7, y: 7 }, "white").ok, false);
});

test("识别横向和斜向五连", () => {
  let horizontal = createGomokuBoard();
  for (let x = 3; x <= 7; x += 1) horizontal = placeGomokuStone(horizontal, { x, y: 8 }, "black").board;
  const horizontalWin = placeGomokuStone(horizontal, { x: 8, y: 8 }, "black");
  assert.equal(horizontalWin.winner, "black");

  let diagonal = createGomokuBoard();
  for (let index = 0; index < 4; index += 1) diagonal = placeGomokuStone(diagonal, { x: index, y: index }, "white").board;
  const diagonalWin = placeGomokuStone(diagonal, { x: 4, y: 4 }, "white");
  assert.equal(diagonalWin.winner, "white");
  assert.equal(diagonalWin.winLine.length, 5);
});

test("回合计时和棋色切换保持稳定", () => {
  assert.equal(gomokuTurnRemainingSeconds(undefined, 1000), 20);
  assert.equal(gomokuTurnRemainingSeconds(1000, 20_100), 1);
  assert.equal(isGomokuTurnTimedOut(1000, 21_001), true);
  assert.equal(nextGomokuStone("black"), "white");
  assert.equal(nextGomokuStone("white"), "black");
});
