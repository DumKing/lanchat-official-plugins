# 官方插件签名

正式插件使用 Ed25519 签名。签名私钥只保存在开发机或 GitHub Actions Secret 中，不提交到仓库。

本机密钥默认放在 `.local-keys/`，该目录已加入 `.gitignore`。当前密钥标识为 `lanchat-official-2026-v1`。

本地签名：

```powershell
$env:LANCHAT_PLUGIN_KEY_ID = "lanchat-official-2026-v1"
$env:LANCHAT_PLUGIN_PRIVATE_KEY_FILE = ".local-keys/lanchat-official-2026-v1-private.pem"
npm run plugin:package -- plugins/com.lanchat.gomoku artifacts
```

GitHub Actions 需要配置：

- `LANCHAT_PLUGIN_KEY_ID`：`lanchat-official-2026-v1`
- `LANCHAT_PLUGIN_PRIVATE_KEY`：私钥 PEM 文件的完整内容

对应公钥发布在 `lanchat-plugin-catalog/trusted-keys.json`，并内置到相同版本的 LanChat 主程序可信密钥环。
