import { readFile, readdir, stat } from "node:fs/promises";
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
  const index = await readFile(resolve(pluginsRoot, pluginId, "public", "index.html"), "utf8");
  const main = await readFile(resolve(pluginsRoot, pluginId, "src", "main.js"), "utf8");
  if (!index.includes('id="inviteButton"')) throw new Error(`${pluginId} 缺少游戏邀请按钮`);
  if (!main.includes("rooms.invite")) throw new Error(`${pluginId} 缺少标准 rooms.invite 调用`);
  if (!main.includes('payload?.action === "join"') && !main.includes('payload?.action==="join"')) {
    throw new Error(`${pluginId} 缺少邀请卡片自动加入处理`);
  }
}

console.log(`官方插件目录校验通过，共 ${expected.size} 个迁移目标。`);
