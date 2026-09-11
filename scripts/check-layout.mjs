import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

const pluginsRoot = resolve("plugins");
const entries = await readdir(pluginsRoot);
const expected = new Set([
  "com.lanchat.gomoku",
  "com.lanchat.xiangqi",
  "com.lanchat.minesweeper",
  "com.lanchat.monopoly",
  "com.lanchat.doudizhu",
]);

for (const pluginId of expected) {
  if (!entries.includes(pluginId) || !(await stat(resolve(pluginsRoot, pluginId))).isDirectory()) {
    throw new Error(`缺少官方插件目录: ${pluginId}`);
  }
}

console.log(`官方插件目录校验通过，共 ${expected.size} 个迁移目标。`);
