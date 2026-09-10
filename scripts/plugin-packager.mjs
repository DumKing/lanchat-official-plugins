import { createHash, sign } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import AdmZip from "adm-zip";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const slash = (path) => path.split(sep).join("/");

async function filesUnder(root, current = root) {
  const found = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) found.push(...await filesUnder(root, path));
    else if (entry.isFile()) found.push(slash(relative(root, path)));
    else throw new Error(`插件产物不能包含链接或特殊文件: ${path}`);
  }
  return found.sort();
}

export async function createIntegrity(root) {
  const files = [];
  for (const path of await filesUnder(root)) {
    if (path === "integrity.json" || path === "signature.json") continue;
    const bytes = await readFile(join(root, path));
    files.push({ path, sha256: sha256(bytes), size: bytes.length });
  }
  return { schemaVersion: 1, files };
}

export function canonicalSignaturePayload(manifest, pluginJson, integrityJson) {
  return Buffer.from(JSON.stringify({
    integritySha256: sha256(integrityJson),
    pluginId: manifest.id,
    pluginJsonSha256: sha256(pluginJson),
    version: manifest.version,
  }));
}

export async function packagePlugin({ pluginDir, outputDir, keyId, privateKey, development = false }) {
  const source = resolve(pluginDir);
  const manifestPath = join(source, "plugin.json");
  const pluginJson = await readFile(manifestPath);
  const manifest = JSON.parse(pluginJson.toString("utf8"));
  if (!manifest.id || !manifest.version) throw new Error("plugin.json 缺少 id 或 version");
  if (!development && (!keyId || !privateKey)) throw new Error("正式插件包必须提供 keyId 和 Ed25519 私钥");

  const staging = await mkdtemp(join(tmpdir(), "lanchat-plugin-"));
  try {
    await cp(manifestPath, join(staging, "plugin.json"));
    for (const directory of ["dist", "assets"]) {
      const sourceDir = join(source, directory);
      if (await stat(sourceDir).then(() => true, () => false)) await cp(sourceDir, join(staging, directory), { recursive: true });
    }
    const integrity = await createIntegrity(staging);
    const integrityJson = Buffer.from(JSON.stringify(integrity, null, 2) + "\n");
    await writeFile(join(staging, "integrity.json"), integrityJson);
    if (!development) {
      const signature = sign(null, canonicalSignaturePayload(manifest, pluginJson, integrityJson), privateKey);
      await writeFile(join(staging, "signature.json"), JSON.stringify({ keyId, signature: signature.toString("hex") }, null, 2) + "\n");
    }
    await mkdir(resolve(outputDir), { recursive: true });
    const output = join(resolve(outputDir), `${manifest.id}-${manifest.version}.lcp`);
    const zip = new AdmZip();
    for (const path of await filesUnder(staging)) zip.addLocalFile(join(staging, path), dirname(path) === "." ? "" : dirname(path), basename(path));
    zip.writeZip(output);
    return { output, manifest, integrity, development };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
