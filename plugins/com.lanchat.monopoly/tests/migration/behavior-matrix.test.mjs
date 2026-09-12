import assert from "node:assert/strict";
import test from "node:test";

const REQUIRED_MIGRATION_ITEMS = [
  "room/create",
  "ready",
  "start",
  "roll",
  "property",
  "item",
  "airport",
  "debt",
  "deity",
  "jail",
  "rematch",
  "flat-ui",
  "3d-ui",
  "invite",
  "recover",
];

const KNOWN_SOURCE_FILES = new Set([
  "e43ef51:src/App.vue",
  "e43ef51:src/styles/monopoly3d-room.css",
  "d932c7b:src/App.vue",
  "d932c7b:src/components/MonopolyBoard3D.vue",
  "d932c7b:src/components/MonopolyRoomChat.vue",
  "d932c7b:src/games/monopoly.ts",
  "d932c7b:src/games/monopolyRoom.ts",
  "d932c7b:scripts/test-monopoly-room.mjs",
  "d932c7b:scripts/test-monopoly-rules.mjs",
  "d932c7b:scripts/test-monopoly-ui.mjs",
  "d932c7b:public/games/monopoly/avatars/player-characters.png",
  "d932c7b:public/games/monopoly/avatars/player-portraits.png",
  "d932c7b:public/games/monopoly/buildings/style-1.png",
  "d932c7b:public/games/monopoly/buildings/style-2.png",
  "d932c7b:public/games/monopoly/buildings/style-3.png",
  "d932c7b:public/games/monopoly/corners/corner-landmarks.png",
  "d932c7b:public/games/monopoly/events/slot-machine.png",
  "d932c7b:public/games/monopoly/items/board-items.png",
]);

const MIGRATION_MATRIX = [
  {
    item: "room/create",
    sourceFiles: ["e43ef51:src/App.vue", "d932c7b:src/games/monopolyRoom.ts"],
    targetFiles: ["src/App.vue", "src/domain/monopoly-room.ts"],
    verificationTests: ["tests/components/room-actions.test.ts", "tests/domain/monopoly-room.test.ts"],
  },
  {
    item: "ready",
    sourceFiles: ["e43ef51:src/App.vue", "d932c7b:src/games/monopolyRoom.ts"],
    targetFiles: ["src/domain/monopoly-room.ts", "src/domain/presentation.ts"],
    verificationTests: ["tests/domain/monopoly-room.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "start",
    sourceFiles: ["e43ef51:src/App.vue", "d932c7b:src/games/monopolyRoom.ts"],
    targetFiles: ["src/domain/monopoly-room.ts", "src/domain/presentation.ts"],
    verificationTests: ["tests/domain/monopoly-room.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "roll",
    sourceFiles: ["d932c7b:src/games/monopoly.ts", "d932c7b:src/games/monopolyRoom.ts"],
    targetFiles: ["src/domain/monopoly.ts", "src/domain/monopoly-room.ts"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/domain/determinism.test.ts"],
  },
  {
    item: "property",
    sourceFiles: ["d932c7b:src/games/monopoly.ts", "d932c7b:scripts/test-monopoly-rules.mjs"],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyGameCenter.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "item",
    sourceFiles: ["d932c7b:src/games/monopoly.ts", "e43ef51:src/App.vue"],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyTargetDialog.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/dialogs.test.ts"],
  },
  {
    item: "airport",
    sourceFiles: ["d932c7b:src/games/monopoly.ts", "e43ef51:src/App.vue"],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyTargetDialog.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/dialogs.test.ts"],
  },
  {
    item: "debt",
    sourceFiles: ["d932c7b:src/games/monopoly.ts", "d932c7b:src/games/monopolyRoom.ts"],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyGameCenter.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "deity",
    sourceFiles: ["d932c7b:src/games/monopoly.ts", "d932c7b:src/components/MonopolyBoard3D.vue"],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyBoard3D.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/board-3d.test.ts"],
  },
  {
    item: "jail",
    sourceFiles: ["d932c7b:src/games/monopoly.ts", "d932c7b:src/games/monopolyRoom.ts", "e43ef51:src/App.vue"],
    targetFiles: ["src/domain/monopoly.ts", "src/components/MonopolyPlayerCards.vue"],
    verificationTests: ["tests/domain/monopoly-rules.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "rematch",
    sourceFiles: ["d932c7b:src/games/monopolyRoom.ts", "e43ef51:src/App.vue"],
    targetFiles: ["src/domain/monopoly-room.ts", "src/components/MonopolySettlement.vue"],
    verificationTests: ["tests/domain/monopoly-room.test.ts", "tests/components/settlement.test.ts"],
  },
  {
    item: "flat-ui",
    sourceFiles: ["e43ef51:src/App.vue", "d932c7b:scripts/test-monopoly-ui.mjs"],
    targetFiles: ["src/App.vue", "src/components/MonopolyBoardFlat.vue", "src/styles/monopoly.css"],
    verificationTests: ["tests/components/flat-layout.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "3d-ui",
    sourceFiles: [
      "d932c7b:src/components/MonopolyBoard3D.vue",
      "e43ef51:src/styles/monopoly3d-room.css",
      "d932c7b:scripts/test-monopoly-ui.mjs",
      "d932c7b:public/games/monopoly/avatars/player-characters.png",
      "d932c7b:public/games/monopoly/avatars/player-portraits.png",
      "d932c7b:public/games/monopoly/buildings/style-1.png",
      "d932c7b:public/games/monopoly/buildings/style-2.png",
      "d932c7b:public/games/monopoly/buildings/style-3.png",
      "d932c7b:public/games/monopoly/corners/corner-landmarks.png",
      "d932c7b:public/games/monopoly/events/slot-machine.png",
      "d932c7b:public/games/monopoly/items/board-items.png",
    ],
    targetFiles: ["src/components/MonopolyBoard3D.vue", "src/styles/monopoly-3d.css", "public/assets/monopoly"],
    verificationTests: ["tests/components/board-3d.test.ts", "tests/components/assets.test.ts"],
  },
  {
    item: "invite",
    sourceFiles: ["d932c7b:src/App.vue", "d932c7b:src/games/monopolyRoom.ts"],
    targetFiles: ["src/host/lanchat-api.ts", "src/host/room-adapter.ts", "src/App.vue"],
    verificationTests: ["tests/host/invite.test.ts", "tests/components/room-actions.test.ts"],
  },
  {
    item: "recover",
    sourceFiles: ["d932c7b:src/games/monopolyRoom.ts", "d932c7b:scripts/test-monopoly-room.mjs"],
    targetFiles: ["src/host/room-adapter.ts", "src/domain/state-hash.ts"],
    verificationTests: ["tests/host/room-adapter.test.ts", "tests/domain/determinism.test.ts"],
  },
];

test("迁移矩阵覆盖全部必需能力", () => {
  const actualItems = MIGRATION_MATRIX.map(({ item }) => item).sort();
  assert.deepEqual(actualItems, [...REQUIRED_MIGRATION_ITEMS].sort());
});

test("每个迁移项都声明已冻结来源、插件目标和后续行为测试", () => {
  for (const entry of MIGRATION_MATRIX) {
    assert.ok(entry.sourceFiles.length > 0, `${entry.item} 缺少源文件`);
    assert.ok(entry.targetFiles.length > 0, `${entry.item} 缺少目标文件`);
    assert.ok(entry.verificationTests.length > 0, `${entry.item} 缺少后续行为测试`);

    for (const sourceFile of entry.sourceFiles) {
      assert.ok(KNOWN_SOURCE_FILES.has(sourceFile), `${entry.item} 使用了未冻结的源文件 ${sourceFile}`);
    }
    for (const targetFile of entry.targetFiles) {
      assert.match(targetFile, /^(?:public|src)\//, `${entry.item} 的目标必须位于插件源码或资源目录`);
    }
    for (const verificationTest of entry.verificationTests) {
      assert.match(verificationTest, /^tests\/(?:components|domain|host)\/.+\.test\.ts$/, `${entry.item} 的验证路径必须指向后续行为测试`);
    }
  }
});

test("迁移矩阵不以尚未创建的目标文件作为完成功能的判据", () => {
  assert.ok(
    MIGRATION_MATRIX.some(({ targetFiles }) => targetFiles.includes("src/domain/monopoly.ts")),
    "矩阵应允许记录后续任务才会创建的目标文件",
  );
});
