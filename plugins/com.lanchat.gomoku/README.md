# com.lanchat.gomoku

五子棋官方插件。当前已经迁入棋盘规则、房间状态机、独立页面、主题同步、房间事件与排行榜提交，并可构建和打包为 `.lcp`。

```powershell
npm test --workspace @dumking/lanchat-plugin-gomoku
npm run build --workspace @dumking/lanchat-plugin-gomoku
npm run plugin:package -- plugins/com.lanchat.gomoku artifacts --development
```
