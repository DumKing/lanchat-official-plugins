import test from "node:test";
import assert from "node:assert/strict";
import { applyGomokuEvent, createGomokuSession } from "../src/session.js";

test("两名玩家准备后由房主开始对局", () => {
  let state = createGomokuSession("room-1", "peer-a", ["peer-a", "peer-b"]);
  state = applyGomokuEvent(state, event("peer-a", "gomoku.ready", { ready: true }));
  state = applyGomokuEvent(state, event("peer-b", "gomoku.ready", { ready: true }));
  state = applyGomokuEvent(state, event("peer-a", "gomoku.start", {}));

  assert.equal(state.phase, "playing");
  assert.equal(state.currentPeerId, "peer-a");
  assert.equal(state.seats[0].stone, "black");
  assert.equal(state.seats[1].stone, "white");
});

test("只接受当前玩家的合法落子", () => {
  let state = startedSession();
  const ignored = applyGomokuEvent(state, event("peer-b", "gomoku.move", { x: 7, y: 7 }));
  assert.equal(ignored, state);

  state = applyGomokuEvent(state, event("peer-a", "gomoku.move", { x: 7, y: 7 }));
  assert.equal(state.board[7][7], "black");
  assert.equal(state.currentPeerId, "peer-b");
});

test("认输结束对局且再来一局直接回到准备阶段", () => {
  let state = startedSession();
  state = applyGomokuEvent(state, event("peer-b", "gomoku.resign", {}));
  assert.equal(state.phase, "ended");
  assert.equal(state.winnerPeerId, "peer-a");

  state = applyGomokuEvent(state, event("peer-a", "gomoku.restart", {}));
  assert.equal(state.phase, "lobby");
  assert.equal(state.board.flat().every((cell) => cell === null), true);
  assert.equal(state.seats.every((seat) => !seat.ready), true);
});

function startedSession() {
  let state = createGomokuSession("room-1", "peer-a", ["peer-a", "peer-b"]);
  state = applyGomokuEvent(state, event("peer-a", "gomoku.ready", { ready: true }));
  state = applyGomokuEvent(state, event("peer-b", "gomoku.ready", { ready: true }));
  return applyGomokuEvent(state, event("peer-a", "gomoku.start", {}));
}

function event(senderPeerId, type, payload) {
  return {
    sequence: 1,
    roomId: "room-1",
    gameId: "gomoku",
    senderPeerId,
    schemaVersion: 1,
    idempotencyKey: `${senderPeerId}-${type}`,
    type,
    payload,
  };
}
