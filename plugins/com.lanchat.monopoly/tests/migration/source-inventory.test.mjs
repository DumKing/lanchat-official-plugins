import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { BASELINE_COMMITS, MIGRATION_MATRIX, SOURCE_INVENTORY } from "./migration-manifest.mjs";

const OFFICIAL_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const REQUIRED_KINDS = ["asset", "component", "rule", "style", "template", "test"];

function textOutput(value) {
  if (typeof value === "string") return value.trim();
  if (value instanceof Uint8Array) return Buffer.from(value).toString("utf8").trim();
  return "";
}

function gitDiagnostics(repoRoot, args, status, stderr, launchError) {
  return [
    `命令: git -C "${repoRoot}" ${args.join(" ")}`,
    `候选路径: ${repoRoot}`,
    `退出码: ${Number.isInteger(status) ? status : "无"}`,
    `stderr: ${stderr || "无"}`,
    launchError ? `启动错误: ${launchError.message}` : null,
  ].filter(Boolean).join("\n");
}

function runGit(repoRoot, args, runner = spawnSync) {
  let result;
  try {
    result = runner("git", ["-C", repoRoot, ...args], { encoding: "utf8" });
  } catch (error) {
    result = { error, status: null, stdout: null, stderr: null };
  }

  if (result?.error) {
    const stdout = textOutput(result.stdout);
    const stderr = textOutput(result.stderr);
    return {
      ok: false,
      stdout,
      stderr,
      diagnostics: gitDiagnostics(repoRoot, args, result.status, stderr, result.error),
    };
  }

  const stdout = textOutput(result?.stdout);
  const stderr = textOutput(result?.stderr);
  return {
    ok: result?.status === 0,
    stdout,
    stderr,
    diagnostics: gitDiagnostics(repoRoot, args, result?.status, stderr),
  };
}

function mainRepositoryCandidates() {
  return [
    OFFICIAL_REPO_ROOT,
    "D:\\lanchat\\lanchat",
    path.resolve(OFFICIAL_REPO_ROOT, "../lanchat"),
    path.resolve(OFFICIAL_REPO_ROOT, "../.."),
  ];
}

function verifyRepository(repoRoot, runner) {
  for (const revision of Object.values(BASELINE_COMMITS)) {
    const result = runGit(repoRoot, ["rev-parse", "--verify", `${revision}^{commit}`], runner);
    if (!result.ok) return result;
  }
  return { ok: true };
}

function locateMainRepository({
  override = process.env.LANCHAT_MAIN_REPO,
  autoCandidates = mainRepositoryCandidates(),
  runner = spawnSync,
} = {}) {
  if (override !== undefined) {
    const result = verifyRepository(override, runner);
    if (!result.ok) assert.fail(`LANCHAT_MAIN_REPO 强制路径验证失败\n${result.diagnostics}`);
    return override;
  }

  const failures = [];
  for (const candidate of [...new Set(autoCandidates)]) {
    const result = verifyRepository(candidate, runner);
    if (result.ok) return candidate;
    failures.push(result.diagnostics);
  }
  assert.fail(`找不到同时包含完整迁移基线的 LanChat 主程序仓库\n${failures.join("\n---\n")}`);
}

const MAIN_REPO_ROOT = locateMainRepository();

test("主仓库自动定位候选包含当前官方仓库根目录", () => {
  assert.ok(mainRepositoryCandidates().includes(OFFICIAL_REPO_ROOT));
});

test("LANCHAT_MAIN_REPO 无效时立即失败且不回退自动候选", () => {
  const attemptedRepositories = [];
  const previousOverride = process.env.LANCHAT_MAIN_REPO;
  const runner = (_command, args) => {
    const repository = args[1];
    attemptedRepositories.push(repository);
    if (repository === "Z:/automatic-fallback") return { status: 0, stdout: "resolved", stderr: "" };
    return { status: 128, stdout: "", stderr: "fatal: not a git repository" };
  };

  process.env.LANCHAT_MAIN_REPO = "Z:/broken-override";
  try {
    assert.throws(
      () => locateMainRepository({ autoCandidates: ["Z:/automatic-fallback"], runner }),
      /LANCHAT_MAIN_REPO 强制路径验证失败[\s\S]*Z:\/broken-override[\s\S]*退出码: 128[\s\S]*fatal: not a git repository/u,
    );
  } finally {
    if (previousOverride === undefined) delete process.env.LANCHAT_MAIN_REPO;
    else process.env.LANCHAT_MAIN_REPO = previousOverride;
  }
  assert.deepEqual(attemptedRepositories, ["Z:/broken-override"]);
});

test("LANCHAT_MAIN_REPO 已设置为空字符串时也禁止自动回退", () => {
  const attemptedRepositories = [];
  const runner = (_command, args) => {
    attemptedRepositories.push(args[1]);
    return { status: args[1] === "Z:/automatic-fallback" ? 0 : 128, stdout: "", stderr: "empty override" };
  };

  assert.throws(
    () => locateMainRepository({ override: "", autoCandidates: ["Z:/automatic-fallback"], runner }),
    /LANCHAT_MAIN_REPO 强制路径验证失败/u,
  );
  assert.deepEqual(attemptedRepositories, [""]);
});

test("Git 无法启动时返回包含命令、候选路径、退出码和 stderr 的诊断", () => {
  const result = runGit("Z:/missing-repository", ["ls-tree", "--name-only", "deadbeef"], () => ({
    error: new Error("spawn git ENOENT"),
    status: null,
    stdout: null,
    stderr: null,
  }));

  assert.equal(result.ok, false);
  assert.match(result.diagnostics, /命令: git -C/u);
  assert.match(result.diagnostics, /候选路径: Z:\/missing-repository/u);
  assert.match(result.diagnostics, /退出码: 无/u);
  assert.match(result.diagnostics, /stderr: 无/u);
  assert.match(result.diagnostics, /spawn git ENOENT/u);
});

test("CI 以完整历史检出主程序并运行迁移护栏", () => {
  const workflow = readFileSync(path.join(OFFICIAL_REPO_ROOT, ".github/workflows/ci.yml"), "utf8");
  assert.match(workflow, /repository:\s*DumKing\/lanchat/u);
  assert.match(workflow, /fetch-depth:\s*0/u);
  assert.match(workflow, /LANCHAT_MAIN_REPO:\s*\$\{\{ github\.workspace \}\}\/\.ci\/lanchat/u);
  assert.match(workflow, /npm (?:run test:migration|test) --workspace @dumking\/lanchat-plugin-monopoly/u);
});

test("迁移 manifest 覆盖设计要求的旧模板、组件、规则、样式、测试和资源", () => {
  const kinds = new Set(SOURCE_INVENTORY.map(({ kind }) => kind));
  assert.deepEqual([...kinds].sort(), REQUIRED_KINDS);
});

test("迁移矩阵中的每个来源都属于共享来源清单", () => {
  const inventoryRefs = new Set(SOURCE_INVENTORY.map(({ commit, path: sourcePath }) => `${commit}:${sourcePath}`));
  for (const { item, sourceFiles } of MIGRATION_MATRIX) {
    for (const sourceFile of sourceFiles) assert.ok(inventoryRefs.has(sourceFile), `${item} 使用了清单外来源 ${sourceFile}`);
  }
});

for (const revision of Object.values(BASELINE_COMMITS)) {
  test(`${revision} 基线包含 manifest 中冻结的全部来源文件`, () => {
    const result = runGit(MAIN_REPO_ROOT, ["ls-tree", "-r", "--name-only", revision]);
    assert.equal(result.ok, true, result.diagnostics);

    const treeFiles = new Set(result.stdout.split(/\r?\n/u).filter(Boolean));
    const missingFiles = SOURCE_INVENTORY
      .filter(({ commit }) => commit === revision)
      .map(({ path: sourcePath }) => sourcePath)
      .filter((sourcePath) => !treeFiles.has(sourcePath));
    assert.deepEqual(missingFiles, [], `${revision} 缺少 manifest 中冻结的迁移来源`);
  });
}
