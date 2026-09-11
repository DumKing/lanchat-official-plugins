import test from "node:test";
import assert from "node:assert/strict";
import { createBoard, isLegalMove, movePiece } from "../src/xiangqi.js";
import { applyEvent, createSession } from "../src/session.js";
test("象棋初始棋盘和基础走法", () => { const board = createBoard(); assert.equal(board.flat().filter(Boolean).length, 32); assert.equal(isLegalMove(board, { x: 0, y: 9 }, { x: 0, y: 8 }, "red"), true); assert.equal(isLegalMove(board, { x: 1, y: 9 }, { x: 1, y: 7 }, "red"), false); assert.equal(movePiece(board, { x: 0, y: 9 }, { x: 0, y: 8 }, "red").ok, true); });
test("双方准备后开始并轮流走棋", () => { let state = createSession("r", "a", ["a", "b"]); const event = (senderPeerId, type, payload = {}) => ({ roomId: "r", gameId: "xiangqi", senderPeerId, type, payload, idempotencyKey: `${senderPeerId}-${type}` }); state = applyEvent(state, event("a", "xiangqi.ready", { ready: true })); state = applyEvent(state, event("b", "xiangqi.ready", { ready: true })); state = applyEvent(state, event("a", "xiangqi.start")); assert.equal(state.phase, "playing"); state = applyEvent(state, event("a", "xiangqi.move", { from: { x: 0, y: 9 }, to: { x: 0, y: 8 } })); assert.equal(state.currentSide, "black"); });
