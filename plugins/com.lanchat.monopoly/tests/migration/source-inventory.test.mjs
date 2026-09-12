import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const OFFICIAL_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const BASELINES = {
  e43ef51: [
    { kind: "template", path: "src/App.vue" },
    { kind: "style", path: "src/styles/monopoly3d-room.css" },
  ],
  d932c7b: [
    { kind: "template", path: "src/App.vue" },
    { kind: "component", path: "src/components/MonopolyBoard3D.vue" },
    { kind: "component", path: "src/components/MonopolyRoomChat.vue" },
    { kind: "rule", path: "src/games/monopoly.ts" },
    { kind: "rule", path: "src/games/monopolyRoom.ts" },
    { kind: "test", path: "scripts/test-monopoly-room.mjs" },
    { kind: "test", path: "scripts/test-monopoly-rules.mjs" },
    { kind: "test", path: "scripts/test-monopoly-ui.mjs" },
    { kind: "asset", path: "public/games/monopoly/avatars/player-characters.png" },
    { kind: "asset", path: "public/games/monopoly/avatars/player-portraits.png" },
    { kind: "asset", path: "public/games/monopoly/buildings/style-1.png" },
    { kind: "asset", path: "public/games/monopoly/buildings/style-2.png" },
    { kind: "asset", path: "public/games/monopoly/buildings/style-3.png" },
    { kind: "asset", path: "public/games/monopoly/corners/corner-landmarks.png" },
    { kind: "asset", path: "public/games/monopoly/events/slot-machine.png" },
    { kind: "asset", path: "public/games/monopoly/items/board-items.png" },
  ],
};

function runGit(repoRoot, args) {
  const result = spawnSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" });
  return { ok: result.status === 0, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

function mainRepositoryCandidates() {
  return [
    process.env.LANCHAT_MAIN_REPO,
    OFFICIAL_REPO_ROOT,
    "D:\\lanchat\\lanchat",
    path.resolve(OFFICIAL_REPO_ROOT, "../lanchat"),
    path.resolve(OFFICIAL_REPO_ROOT, "../.."),
  ].filter(Boolean);
}

function locateMainRepository() {
  for (const candidate of [...new Set(mainRepositoryCandidates())]) {
    if (Object.keys(BASELINES).every((revision) => runGit(candidate, ["rev-parse", "--verify", `${revision}^{commit}`]).ok)) {
      return candidate;
    }
  }
  assert.fail(`找不到同时包含基线 ${Object.keys(BASELINES).join("、")} 的 LanChat 主程序仓库`);
}

const MAIN_REPO_ROOT = locateMainRepository();

test("主仓库定位候选包含当前官方仓库根目录", () => {
  assert.ok(mainRepositoryCandidates().includes(OFFICIAL_REPO_ROOT));
});

test("迁移来源清单覆盖设计要求的旧模板、组件、规则、样式、测试和资源", () => {
  const kinds = new Set(Object.values(BASELINES).flat().map(({ kind }) => kind));
  assert.deepEqual([...kinds].sort(), ["asset", "component", "rule", "style", "template", "test"]);
});

for (const [revision, inventory] of Object.entries(BASELINES)) {
  test(`${revision} 基线包含清单中冻结的全部来源文件`, () => {
    const result = runGit(MAIN_REPO_ROOT, ["ls-tree", "-r", "--name-only", revision]);
    assert.equal(result.ok, true, result.stderr);

    const treeFiles = new Set(result.stdout.split(/\r?\n/u).filter(Boolean));
    const missingFiles = inventory.map(({ path: sourcePath }) => sourcePath).filter((sourcePath) => !treeFiles.has(sourcePath));
    assert.deepEqual(missingFiles, [], `${revision} 缺少设计中冻结的迁移来源`);
  });
}
