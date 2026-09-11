import { applyGomokuEvent, createGomokuSession } from "./session.js";

const api = window.lanchat;
const elements = Object.fromEntries([
  "board", "roomList", "roomName", "roomMeta", "statusText", "connectionState",
  "refreshRooms", "createRoom", "readyButton", "startButton", "resignButton", "restartButton", "leaveButton",
].map((id) => [id, document.getElementById(id)]));
let activeRoom = null;
let session = null;
let eventCounter = 0;

renderBoard();
bindActions();

if (!api) {
  elements.connectionState.textContent = "宿主 API 不可用";
  elements.statusText.textContent = "请在 LanChat 插件中心安装并打开此插件";
  setActionsDisabled(true);
} else {
  api.events.onPluginEnter(() => refreshRooms());
  api.events.onThemeChanged(applyTheme);
  api.events.onRoomEvent(handleRoomEvent);
  api.events.onPluginOut(() => { activeRoom = null; session = null; render(); });
  Promise.all([api.theme.current().then(applyTheme), refreshRooms()]).catch(reportError);
}

function bindActions() {
  elements.refreshRooms.addEventListener("click", refreshRooms);
  elements.createRoom.addEventListener("click", createRoom);
  elements.readyButton.addEventListener("click", () => send("gomoku.ready", { ready: true }));
  elements.startButton.addEventListener("click", () => send("gomoku.start", {}));
  elements.resignButton.addEventListener("click", () => send("gomoku.resign", {}));
  elements.restartButton.addEventListener("click", () => send("gomoku.restart", {}));
  elements.leaveButton.addEventListener("click", leaveRoom);
}

async function refreshRooms() {
  if (!api) return;
  const rooms = await api.rooms.list({ gameId: "gomoku" });
  elements.roomList.replaceChildren(...rooms.map(roomCard));
  if (rooms.length === 0) elements.roomList.innerHTML = '<p class="empty">还没有五子棋房间</p>';
}

function roomCard(room) {
  const card = document.createElement("article");
  card.className = "room-card";
  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = room.name || `房间 ${room.roomId.slice(0, 6)}`;
  const meta = document.createElement("small");
  meta.textContent = `${room.memberPeerIds.length}/2 人`;
  copy.append(title, meta);
  const button = document.createElement("button");
  button.textContent = "加入";
  button.addEventListener("click", () => joinRoom(room.roomId));
  card.append(copy, button);
  return card;
}

async function createRoom() {
  const name = elements.roomName.value.trim() || "五子棋对局";
  activeRoom = await api.rooms.create({ gameId: "gomoku", name, maxPlayers: 2, schemaVersion: 1 });
  session = createGomokuSession(activeRoom.roomId, activeRoom.ownerPeerId, activeRoom.memberPeerIds);
  render();
  await refreshRooms();
}

async function joinRoom(roomId) {
  activeRoom = await api.rooms.join({ roomId });
  session = await api.rooms.snapshot({ roomId }).catch(() => null)
    || createGomokuSession(activeRoom.roomId, activeRoom.ownerPeerId, activeRoom.memberPeerIds);
  render();
}

async function leaveRoom() {
  if (activeRoom) await api.rooms.leave({ roomId: activeRoom.roomId });
  activeRoom = null;
  session = null;
  render();
  await refreshRooms();
}

async function send(type, payload) {
  if (!activeRoom) return;
  await api.rooms.send({
    roomId: activeRoom.roomId,
    type,
    payload,
    idempotencyKey: `${activeRoom.roomId}-${Date.now()}-${eventCounter += 1}`,
  }).catch(reportError);
}

function handleRoomEvent(event) {
  if (!activeRoom || event.roomId !== activeRoom.roomId || event.gameId !== "gomoku") return;
  session = applyGomokuEvent(session, event);
  render();
  if (session?.phase === "ended") {
    void api.leaderboard.submit({
      gameId: "gomoku",
      roomId: activeRoom.roomId,
      idempotencyKey: `${activeRoom.roomId}-result-${event.sequence}`,
      result: { winnerPeerId: session.winnerPeerId, draw: session.draw },
    }).catch(reportError);
  }
}

function render() {
  elements.roomMeta.textContent = activeRoom ? `房间 ${activeRoom.roomId.slice(0, 8)} · ${activeRoom.memberPeerIds.length}/2 人` : "尚未进入房间";
  elements.statusText.textContent = session ? statusText(session) : "选择或创建一个房间";
  renderBoard();
  setActionsDisabled(!activeRoom);
  elements.startButton.disabled = !session || session.phase !== "lobby" || !session.seats.every((seat) => seat.ready);
  elements.resignButton.disabled = !session || session.phase !== "playing";
  elements.restartButton.disabled = !session || session.phase !== "ended";
}

function renderBoard() {
  const board = session?.board ?? Array.from({ length: 15 }, () => Array(15).fill(null));
  const wins = new Set((session?.winLine ?? []).map((point) => `${point.x}:${point.y}`));
  elements.board.replaceChildren(...board.flatMap((row, y) => row.map((stone, x) => {
    const button = document.createElement("button");
    button.className = `cell${stone ? ` ${stone}` : ""}${wins.has(`${x}:${y}`) ? " win" : ""}`;
    button.ariaLabel = `${x + 1},${y + 1}${stone ? ` ${stone}` : " 空"}`;
    button.disabled = !activeRoom || session?.phase !== "playing" || Boolean(stone);
    button.addEventListener("click", () => send("gomoku.move", { x, y }));
    return button;
  })));
}

function statusText(value) {
  if (value.phase === "lobby") return value.seats.every((seat) => seat.ready) ? "双方已准备，等待房主开始" : "等待双方准备";
  if (value.phase === "ended") return value.draw ? "本局和棋" : `玩家 ${value.winnerPeerId ?? "-"} 获胜`;
  return `轮到玩家 ${value.currentPeerId ?? "-"}`;
}

function setActionsDisabled(disabled) {
  for (const id of ["readyButton", "startButton", "resignButton", "restartButton", "leaveButton"]) elements[id].disabled = disabled;
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme.mode;
  for (const [name, value] of Object.entries(theme.tokens ?? {})) root.style.setProperty(`--${name}`, value);
}

function reportError(error) {
  const message = error instanceof Error ? error.message : String(error);
  void api?.logger.error("五子棋插件操作失败", { message });
  void api?.ui.notify({ title: "五子棋", body: message, level: "error" });
}
