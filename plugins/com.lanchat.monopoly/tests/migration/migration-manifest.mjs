export const BASELINE_COMMITS = Object.freeze({
  visual: "e43ef51b101f85a3e9f6f8b150c621698d6d5754",
  behavior: "d932c7be9131f3c6e9683f966314f4139b1692a9",
});

const source = (commit, path) => `${commit}:${path}`;
const visual = (path) => source(BASELINE_COMMITS.visual, path);
const behavior = (path) => source(BASELINE_COMMITS.behavior, path);

export const SOURCE_INVENTORY = Object.freeze([
  { commit: BASELINE_COMMITS.visual, kind: "template", path: "src/App.vue" },
  { commit: BASELINE_COMMITS.visual, kind: "style", path: "src/styles/monopoly3d-room.css" },
  { commit: BASELINE_COMMITS.behavior, kind: "template", path: "src/App.vue" },
  { commit: BASELINE_COMMITS.behavior, kind: "component", path: "src/components/MonopolyBoard3D.vue" },
  { commit: BASELINE_COMMITS.behavior, kind: "component", path: "src/components/MonopolyRoomChat.vue" },
  { commit: BASELINE_COMMITS.behavior, kind: "rule", path: "src/games/monopoly.ts" },
  { commit: BASELINE_COMMITS.behavior, kind: "rule", path: "src/games/monopolyRoom.ts" },
  { commit: BASELINE_COMMITS.behavior, kind: "test", path: "scripts/test-monopoly-room.mjs" },
  { commit: BASELINE_COMMITS.behavior, kind: "test", path: "scripts/test-monopoly-rules.mjs" },
  { commit: BASELINE_COMMITS.behavior, kind: "test", path: "scripts/test-monopoly-ui.mjs" },
  { commit: BASELINE_COMMITS.behavior, kind: "asset", path: "public/games/monopoly/avatars/player-characters.png" },
  { commit: BASELINE_COMMITS.behavior, kind: "asset", path: "public/games/monopoly/avatars/player-portraits.png" },
  { commit: BASELINE_COMMITS.behavior, kind: "asset", path: "public/games/monopoly/buildings/style-1.png" },
  { commit: BASELINE_COMMITS.behavior, kind: "asset", path: "public/games/monopoly/buildings/style-2.png" },
  { commit: BASELINE_COMMITS.behavior, kind: "asset", path: "public/games/monopoly/buildings/style-3.png" },
  { commit: BASELINE_COMMITS.behavior, kind: "asset", path: "public/games/monopoly/corners/corner-landmarks.png" },
  { commit: BASELINE_COMMITS.behavior, kind: "asset", path: "public/games/monopoly/events/slot-machine.png" },
  { commit: BASELINE_COMMITS.behavior, kind: "asset", path: "public/games/monopoly/items/board-items.png" },
]);

export const MIGRATION_MATRIX = Object.freeze([
  {
    item: "room/create",
    sourceFiles: [visual("src/App.vue"), behavior("src/games/monopolyRoom.ts")],
    targetFiles: ["src/App.vue", "src/domain/monopoly-room.ts"],
    verificationTests: ["tests/components/room-actions.test.ts", "tests/domain/monopoly-room.test.ts"],
  },
  {
    item: "ready",
    sourceFiles: [visual("src/App.vue"), behavior("src/games/monopolyRoom.ts")],
    targetFiles: ["src/domain/monopoly-room.ts", "src/domain/presentation.ts"],
    verificationTests: ["tests/domain/monopoly-room.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "start",
    sourceFiles: [visual("src/App.vue"), behavior("src/games/monopolyRoom.ts")],
    targetFiles: ["src/domain/monopoly-room.ts", "src/domain/presentation.ts"],
    verificationTests: ["tests/domain/monopoly-room.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "roll",
    sourceFiles: [behavior("src/games/monopoly.ts"), behavior("src/games/monopolyRoom.ts")],
    targetFiles: ["src/domain/monopoly.ts", "src/domain/monopoly-room.ts"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/domain/determinism.test.ts"],
  },
  {
    item: "property",
    sourceFiles: [behavior("src/games/monopoly.ts"), behavior("scripts/test-monopoly-rules.mjs")],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyGameCenter.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "item",
    sourceFiles: [behavior("src/games/monopoly.ts"), visual("src/App.vue")],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyTargetDialog.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/dialogs.test.ts"],
  },
  {
    item: "airport",
    sourceFiles: [behavior("src/games/monopoly.ts"), visual("src/App.vue")],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyTargetDialog.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/dialogs.test.ts"],
  },
  {
    item: "debt",
    sourceFiles: [behavior("src/games/monopoly.ts"), behavior("src/games/monopolyRoom.ts")],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyGameCenter.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "deity",
    sourceFiles: [behavior("src/games/monopoly.ts"), behavior("src/components/MonopolyBoard3D.vue")],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyBoard3D.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/board-3d.test.ts"],
  },
  {
    item: "jail",
    sourceFiles: [behavior("src/games/monopoly.ts"), behavior("src/games/monopolyRoom.ts"), visual("src/App.vue")],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyPlayerCards.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "rematch",
    sourceFiles: [behavior("src/games/monopolyRoom.ts"), visual("src/App.vue")],
    targetFiles: ["src/domain/monopoly-room.ts", "src/components/MonopolySettlement.vue"],
    verificationTests: ["tests/domain/monopoly-room.test.ts", "tests/components/settlement.test.ts"],
  },
  {
    item: "flat-ui",
    sourceFiles: [visual("src/App.vue"), behavior("scripts/test-monopoly-ui.mjs")],
    targetFiles: ["src/App.vue", "src/components/MonopolyBoardFlat.vue", "src/styles/monopoly.css"],
    verificationTests: ["tests/components/flat-layout.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "3d-ui",
    sourceFiles: [
      behavior("src/components/MonopolyBoard3D.vue"),
      visual("src/styles/monopoly3d-room.css"),
      behavior("scripts/test-monopoly-ui.mjs"),
      behavior("public/games/monopoly/avatars/player-characters.png"),
      behavior("public/games/monopoly/avatars/player-portraits.png"),
      behavior("public/games/monopoly/buildings/style-1.png"),
      behavior("public/games/monopoly/buildings/style-2.png"),
      behavior("public/games/monopoly/buildings/style-3.png"),
      behavior("public/games/monopoly/corners/corner-landmarks.png"),
      behavior("public/games/monopoly/events/slot-machine.png"),
      behavior("public/games/monopoly/items/board-items.png"),
    ],
    targetFiles: ["src/components/MonopolyBoard3D.vue", "src/styles/monopoly-3d.css", "public/assets/monopoly"],
    verificationTests: ["tests/components/board-3d.test.ts", "tests/components/assets.test.ts"],
  },
  {
    item: "invite",
    sourceFiles: [behavior("src/App.vue"), behavior("src/games/monopolyRoom.ts")],
    targetFiles: ["src/host/lanchat-api.ts", "src/host/room-adapter.ts", "src/App.vue"],
    verificationTests: ["tests/host/invite.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "recover",
    sourceFiles: [behavior("src/games/monopolyRoom.ts"), behavior("scripts/test-monopoly-room.mjs")],
    targetFiles: ["src/host/room-adapter.ts", "src/domain/state-hash.ts"],
    verificationTests: ["tests/host/room-adapter.test.ts", "tests/domain/determinism.test.ts"],
  },
]);
