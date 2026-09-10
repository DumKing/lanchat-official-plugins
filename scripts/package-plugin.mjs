import { readFile } from "node:fs/promises";
import { packagePlugin } from "./plugin-packager.mjs";

const [pluginDir, outputDir = "artifacts"] = process.argv.slice(2);
if (!pluginDir) throw new Error("用法: npm run plugin:package -- <plugin-dir> [output-dir] [--development]");
const development = process.argv.includes("--development");
const privateKey = process.env.LANCHAT_PLUGIN_PRIVATE_KEY_FILE
  ? await readFile(process.env.LANCHAT_PLUGIN_PRIVATE_KEY_FILE, "utf8")
  : process.env.LANCHAT_PLUGIN_PRIVATE_KEY;
const result = await packagePlugin({
  pluginDir,
  outputDir,
  keyId: process.env.LANCHAT_PLUGIN_KEY_ID,
  privateKey,
  development,
});
console.log(`插件包已生成: ${result.output}`);
