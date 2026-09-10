import { generateKeyPairSync, verify } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import AdmZip from "adm-zip";
import { canonicalSignaturePayload, packagePlugin } from "./plugin-packager.mjs";

const temp = await mkdtemp(join(tmpdir(), "lanchat-packager-test-"));
try {
  const pluginDir = join(temp, "plugin");
  await mkdir(join(pluginDir, "dist"), { recursive: true });
  const manifest = { id: "com.lanchat.test", version: "1.0.0" };
  await writeFile(join(pluginDir, "plugin.json"), JSON.stringify(manifest));
  await writeFile(join(pluginDir, "dist/index.html"), "ok");
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const result = await packagePlugin({ pluginDir, outputDir: join(temp, "out"), keyId: "test", privateKey });
  const zip = new AdmZip(result.output);
  const pluginJson = zip.readFile("plugin.json");
  const integrityJson = zip.readFile("integrity.json");
  const signature = JSON.parse(zip.readAsText("signature.json"));
  if (!verify(null, canonicalSignaturePayload(manifest, pluginJson, integrityJson), publicKey, Buffer.from(signature.signature, "hex"))) {
    throw new Error("生成的插件签名无法验证");
  }
  if (!result.integrity.files.some((file) => file.path === "dist/index.html")) throw new Error("完整性清单遗漏构建产物");
  console.log("插件打包测试通过");
} finally {
  await rm(temp, { recursive: true, force: true });
}
