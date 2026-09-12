# 大富翁成熟界面完整插件化迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将迁移前已验收的大富翁平面/伪 3D 界面、完整规则和真实多人交互迁入 `com.lanchat.monopoly`，同时把宿主补齐为通用的房主权威房间框架，并在验收后清除主程序中的大富翁业务代码。

**Architecture:** 按“通用宿主协议 → 插件确定性领域层 → Vue 界面 → 双客户端恢复验收 → 主程序清理”的单向依赖实施。宿主只持久化和转发带版本的不透明意图、提交与检查点；大富翁插件独立维护规则、展示状态和 UI，房主实例负责裁决，其他实例只重放权威提交。

**Tech Stack:** Vue 3、TypeScript、Vite、Vitest、Vue Test Utils、Tauri 2、Rust、rusqlite、LanChat Plugin SDK、Node.js 20。

---

## 实施边界和基线

- 代码仓库：
  - 主程序与内置 SDK：`D:\lanchat\lanchat`
  - 官方插件：`D:\lanchat\lanchat-official-plugins`
  - 独立 SDK：`D:\lanchat\lanchat-plugin-sdk`
- 界面模板与样式基线：主程序提交 `e43ef51`。
- 已修复规则、组件和资源基线：主程序提交 `d932c7b`。
- 两个基线冲突时，规则以 `d932c7b` 为准，布局和视觉以 `e43ef51` 为准。
- `rooms.send` 保持现有插件兼容；大富翁只使用新增权威 API。不恢复旧大富翁入口、旧邀请文本协议或主程序业务分支。
- 不恢复视觉识别构建，不改动主程序中与本任务无关的未跟踪文件。

## 文件职责图

### 主程序 `D:\lanchat\lanchat`

- `packages/plugin-sdk/src/types.ts`：SDK 权威房间、presence、邀请解析和权威排行榜的公共类型。
- `packages/plugin-sdk/src/index.ts`：新增 API 的客户端调用与事件订阅。
- `src/plugin-host/contracts/bridge.ts`：宿主内部同构契约。
- `src/plugin-host/runtime/schemas.ts`：桥接入参大小、字段和版本校验。
- `src/plugin-host/runtime/capabilities.ts`：方法到权限的映射。
- `src/plugin-host/services/pluginRoomProtocol.ts`：通用 wire frame、revision、checksum 和配额常量；禁止出现 Monopoly 字段。
- `src/plugin-host/services/PluginRoomRepository.ts`：TypeScript 侧调用 Tauri 持久化命令，不维护业务状态。
- `src/plugin-host/services/PluginRoomService.ts`：房间目录、准入、身份绑定、意图路由、权威提交、恢复、presence 和邀请解析。
- `src/plugin-host/services/PluginLeaderboardService.ts`：验证房主、终局提交、席位名单和唯一终局键。
- `src/app/AppShell.vue`：把网络接收帧和在线设备变化交给通用房间服务。
- `src/services/tauri-api.ts`：通用房间持久化命令封装。
- `src/types/lanchat.ts`：LAN `GameFrame` 通用 envelope 类型。
- `src-tauri/src/plugin/room_storage.rs`：SQLite 权威房间表和事务。
- `src-tauri/src/plugin/mod.rs`：导出房间存储模块。
- `src-tauri/src/lib.rs`：注册持久化命令。
- `src-tauri/src/network.rs`：接收时以连接身份覆盖/校验发送者设备 ID。
- `tests/plugin/authoritative-room-service.test.ts`：权威协议、恢复、邀请和 presence 契约。
- `tests/plugin/leaderboard-service.test.ts`：终局排行榜权威和幂等测试。
- `tests/plugin/monopoly-boundary.test.ts`：最终禁止主程序残留大富翁业务。

### 独立 SDK `D:\lanchat\lanchat-plugin-sdk`

- `src/types.ts`、`src/index.ts`：与内置 SDK 同步的公共类型和客户端实现。
- `tests/contract.test.mjs`：用编译后的声明/运行时导出验证两份 SDK 对齐。

### 大富翁插件 `D:\lanchat\lanchat-official-plugins\plugins\com.lanchat.monopoly`

- `src/App.vue`：只编排房间列表、房间页、弹窗和顶层状态。
- `src/main.ts`：Vue 入口、宿主 API 初始化和全局样式。
- `src/domain/types.ts`：完整且可序列化的领域类型。
- `src/domain/monopoly.ts`：纯 reducer、规则和显式随机输入。
- `src/domain/monopoly-room.ts`：大厅、席位、超时、终局和再来一局状态机。
- `src/domain/presentation.ts`：所有按钮可用性、禁用原因和展示文本。
- `src/domain/state-hash.ts`：稳定序列化和 SHA-256 状态哈希。
- `src/host/lanchat-api.ts`：宿主 API 的薄包装与中文错误归一化。
- `src/host/room-adapter.ts`：意图发送、房主裁决、提交重放、缺口恢复和检查点。
- `src/host/theme-adapter.ts`：主题 token 到 CSS 变量。
- `src/components/*.vue`：棋盘、玩家卡、对局中心、日志、聊天、横幅、规则、目标选择和结算。
- `src/styles/monopoly.css`、`src/styles/monopoly-3d.css`：平面与 3D 样式，不在 `App.vue` 堆积业务 CSS。
- `public/assets/monopoly/**`：全部棋盘、建筑、头像、事件、道具和神明资源。
- `tests/domain/*.test.ts`：迁移后的规则等价与确定性测试。
- `tests/host/room-adapter.test.ts`：双实例、乱序、恢复和超时测试。
- `tests/components/*.test.ts`：按钮、弹窗、布局和交互测试。
- `tests/e2e/two-client-checklist.md`：双客户端人工/自动混合验收记录。

## Task 1：冻结迁移清单并建立失败保护测试

**Files:**
- Create: `plugins/com.lanchat.monopoly/tests/migration/source-inventory.test.mjs`
- Create: `plugins/com.lanchat.monopoly/tests/migration/behavior-matrix.test.mjs`
- Modify: `plugins/com.lanchat.monopoly/package.json`

- [ ] **Step 1: 写基线清单测试**

测试用 `git ls-tree -r --name-only e43ef51` 和 `d932c7b` 验证设计中列出的旧组件、规则、样式、测试与资源确实存在，并在插件目录维护显式迁移矩阵。矩阵至少包含 `room/create`、`ready`、`start`、`roll`、`property`、`item`、`airport`、`debt`、`deity`、`jail`、`rematch`、`flat-ui`、`3d-ui`、`invite`、`recover`。矩阵只记录每项的源文件、目标文件和负责测试，不把尚未完成的产品能力当作本任务的失败条件。

- [ ] **Step 2: 运行测试并确认清单完整**

Run: `node --test plugins/com.lanchat.monopoly/tests/migration/source-inventory.test.mjs plugins/com.lanchat.monopoly/tests/migration/behavior-matrix.test.mjs` from `D:\lanchat\lanchat-official-plugins`

Expected: PASS，确认所有设计项都有明确来源、目标和后续测试任务。

- [ ] **Step 3: 添加迁移测试脚本，不修改产品代码**

`package.json` 增加 `test:migration`，并让 `test` 串行执行当前规则测试和迁移清单测试。测试不得把“文件存在”当作功能完成，只用于防止漏迁；真实行为由后续任务先写失败行为测试再实现。

- [ ] **Step 4: 再次运行并确认保护测试通过**

Run: `npm run test:migration --workspace @dumking/lanchat-plugin-monopoly`

Expected: PASS，不提交红灯测试。

- [ ] **Step 5: 提交测试护栏**

```powershell
git add plugins/com.lanchat.monopoly/package.json plugins/com.lanchat.monopoly/tests/migration
git commit -m "test: freeze monopoly migration baseline"
```

## Task 2：扩展两份 SDK 的权威房间契约

**Files:**
- Modify: `D:\lanchat\lanchat\packages\plugin-sdk\src\types.ts`
- Modify: `D:\lanchat\lanchat\packages\plugin-sdk\src\index.ts`
- Modify: `D:\lanchat\lanchat\src\plugin-host\contracts\bridge.ts`
- Modify: `D:\lanchat\lanchat\tests\plugin\sdk-client.test.ts`
- Modify: `D:\lanchat\lanchat-plugin-sdk\src\types.ts`
- Modify: `D:\lanchat\lanchat-plugin-sdk\src\index.ts`
- Create: `D:\lanchat\lanchat-plugin-sdk\tests\contract.test.mjs`

- [ ] **Step 1: 为新增方法和事件写失败契约测试**

测试要求 SDK 暴露：

```ts
rooms.sendIntent({ roomId, commandId, baseRevision, protocolVersion, payload })
rooms.commit({ roomId, commandId, baseRevision, protocolVersion, events, stateHash, terminal })
rooms.publishCheckpoint({ roomId, revision, protocolVersion, payload, stateHash })
rooms.recover({ roomId, afterRevision })
rooms.setAdmission({ roomId, admission: "lobby" | "closed" })
rooms.resolveInvite({ roomId, roomVersion, expiresAt })
events.onRoomPresenceChanged(callback)
leaderboard.submit({ gameId, roomId, terminalRevision, terminalCommitId, stateHash, result })
```

并定义 `PluginAuthoritativeCommit`、`PluginRoomCheckpoint`、`PluginRoomRecovery`、`PluginRoomPresenceEvent`。业务 payload 保持 `unknown`，不得出现大富翁字段。终局 commit 额外保存通用 `terminalResultHash`；`leaderboard.submit` 的 result 必须稳定序列化后与该哈希一致，防止终局后篡改赢家。

- [ ] **Step 2: 运行失败测试**

Run: `npm run test:plugin -- --run tests/plugin/sdk-client.test.ts` in `D:\lanchat\lanchat`

Expected: FAIL，新增方法不存在。

- [ ] **Step 3: 最小实现内置 SDK 和 bridge 类型**

每个方法仅调用对应 bridge method；事件订阅沿用现有 unsubscribe 模式。`rooms.send` 保留原签名。

- [ ] **Step 4: 同步独立 SDK 并增加对齐测试**

对齐测试比较两份 `PluginCapability`、方法名和事件名的固定快照，防止后续漂移。

- [ ] **Step 5: 验证两份 SDK**

Run: `npm run test:plugin -- --run tests/plugin/sdk-client.test.ts && npm run build:plugin-sdk` in `D:\lanchat\lanchat`

Expected: PASS。

Run: `npm run check && npm run build && node --test tests/contract.test.mjs` in `D:\lanchat\lanchat-plugin-sdk`

Expected: PASS。

- [ ] **Step 6: 分仓提交**

```powershell
# lanchat
git add packages/plugin-sdk/src src/plugin-host/contracts/bridge.ts tests/plugin/sdk-client.test.ts
git commit -m "feat: add authoritative room sdk contracts"

# lanchat-plugin-sdk
git add src tests package.json
git commit -m "feat: expose authoritative room sdk"
```

## Task 3：用 SQLite 实现通用权威房间持久化

**Files:**
- Create: `D:\lanchat\lanchat\src-tauri\src\plugin\room_storage.rs`
- Modify: `D:\lanchat\lanchat\src-tauri\src\plugin\mod.rs`
- Modify: `D:\lanchat\lanchat\src-tauri\src\lib.rs`
- Modify: `D:\lanchat\lanchat\src\services\tauri-api.ts`

- [ ] **Step 1: 在 Rust 模块内写失败单元测试**

覆盖：创建 `lobby` 房间、原子关闭准入、连续 revision、错误 `base_revision` 拒绝、`room_id + command_id` 幂等、旧检查点拒绝、checkpoint 后裁剪旧提交、重启后恢复、每提交 256 KiB/检查点 2 MiB/单房间 16 MiB 配额。

- [ ] **Step 2: 运行并确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml plugin::room_storage::tests -- --nocapture`

Expected: FAIL，模块或表尚不存在。

- [ ] **Step 3: 创建通用表和事务 API**

表只保存通用字段：`plugin_rooms`、`plugin_room_members`、`plugin_room_commits`、`plugin_room_checkpoints`。提交事务必须按顺序执行：校验房主与 membership → 校验 `base_revision` → 去重 `command_id` → 分配 `revision` → 保存 checksum/payload → 更新房间 revision。

- [ ] **Step 4: 注册窄 Tauri 命令**

只暴露 `plugin_room_load`、`plugin_room_save_metadata`、`plugin_room_append_commit`、`plugin_room_save_checkpoint`、`plugin_room_close`；前端不能传入调用插件 ID，插件 ID 由 bridge context 绑定后交给 repository。

- [ ] **Step 5: 验证 Rust 与前端类型**

Run: `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`

Expected: PASS。

Run: `cargo test --manifest-path src-tauri/Cargo.toml plugin::room_storage::tests -- --nocapture`

Expected: PASS。

Run: `npm run build` in `D:\lanchat\lanchat`

Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src-tauri/src/plugin src-tauri/src/lib.rs src/services/tauri-api.ts
git commit -m "feat: persist authoritative plugin rooms"
```

## Task 4：实现身份绑定、房主裁决通道与恢复

**Files:**
- Create: `D:\lanchat\lanchat\src\plugin-host\services\pluginRoomProtocol.ts`
- Create: `D:\lanchat\lanchat\src\plugin-host\services\PluginRoomRepository.ts`
- Modify: `D:\lanchat\lanchat\src\plugin-host\services\PluginRoomService.ts`
- Modify: `D:\lanchat\lanchat\src\plugin-host\runtime\schemas.ts`
- Modify: `D:\lanchat\lanchat\src\plugin-host\runtime\capabilities.ts`
- Modify: `D:\lanchat\lanchat\src\app\AppShell.vue`
- Modify: `D:\lanchat\lanchat\src-tauri\src\network.rs`
- Modify: `D:\lanchat\lanchat\src-tauri\src\protocol.rs`
- Create: `D:\lanchat\lanchat\tests\plugin\authoritative-room-service.test.ts`

- [ ] **Step 1: 写权威协议失败测试**

覆盖伪造发送者、非成员意图、意图只到房主、非房主提交、revision 缺口、重复 command、hash 不一致恢复、5 秒房主不可达、旧 checkpoint、增量已裁剪、载荷超限和 schema 不兼容。网络接收测试必须证明 `senderPeerId` 来源是连接身份，不信任 payload。

- [ ] **Step 2: 运行失败测试**

Run: `npm run test:plugin -- --run tests/plugin/authoritative-room-service.test.ts`

Expected: FAIL，新增 handlers 尚不存在。

- [ ] **Step 3: 实现 wire envelope 和 repository**

wire action 限定为 `intent`、`commit`、`recover-request`、`recover-response`、`presence`、`room-upsert`、`room-remove`。所有 envelope 带 `roomId`、`pluginId`、`protocolVersion`；checksum 在持久化前验证。

- [ ] **Step 4: 重构 PluginRoomService**

新增 handlers，并确保：

```ts
if (commit.baseRevision !== room.revision) throw new Error("房间版本已变化，请恢复后重试");
if (callerPeerId !== room.ownerPeerId) throw new Error("只有房主可以提交权威事件");
```

客户端收到未来 revision 时缓存并发起 recover；恢复期间将 room 标为 `readOnly: true`。`rooms.send` 原行为回归测试必须继续通过。

- [ ] **Step 5: 实现准入、邀请解析与 presence**

`join` 在一个宿主事务中检查 `lobby`、人数、协议和 roomVersion。`resolveInvite` 检查 10 分钟有效期并向当前房主查询。presence 事件包含设备 ID、`online/offline/recovered` 和发生时间；不持久化为聊天消息。

- [ ] **Step 6: 验证**

Run: `npm run test:plugin -- --run tests/plugin/room-service.test.ts tests/plugin/authoritative-room-service.test.ts`

Expected: PASS。

Run: `cargo test --manifest-path src-tauri/Cargo.toml protocol::tests`

Expected: PASS。

Run: `cargo test --manifest-path src-tauri/Cargo.toml network::tests`

Expected: PASS；若 `network.rs` 没有独立测试模块，则把身份绑定用例加入 `protocol::tests`，并删除这一条空过滤命令。

- [ ] **Step 7: 提交**

```powershell
git add src/plugin-host src/app/AppShell.vue src-tauri/src/network.rs src-tauri/src/protocol.rs tests/plugin
git commit -m "feat: add authoritative plugin room runtime"
```

## Task 5：收紧排行榜为唯一权威终局

**Files:**
- Modify: `D:\lanchat\lanchat\src\plugin-host\services\PluginLeaderboardService.ts`
- Modify: `D:\lanchat\lanchat\src\plugin-host\services\leaderboardRecords.ts`
- Modify: `D:\lanchat\lanchat\src-tauri\src\storage.rs`
- Modify: `D:\lanchat\lanchat\src-tauri\src\lib.rs`
- Modify: `D:\lanchat\lanchat\src\services\tauri-api.ts`
- Modify: `D:\lanchat\lanchat\tests\plugin\leaderboard-service.test.ts`

- [ ] **Step 1: 写失败测试**

测试非房主提交、非最新终局 revision、commitId 不存在、hash 不符、伪造参赛名单、改变幂等键重复提交、宿主重启后重试，以及统计写入中断回滚。参赛名单必须来自锁定席位；默认策略为真人数大于 1，明确标记的单机游戏允许单人，扫雷沿用独立计时榜。

- [ ] **Step 2: 运行并确认失败**

Run: `npm run test:plugin -- --run tests/plugin/leaderboard-service.test.ts`

Expected: FAIL，当前服务仍信任插件 result 和内存 idempotencyKey。

- [ ] **Step 3: 先实现跨进程唯一终局账本**

在主存储数据库增加 `plugin_terminal_submissions`，唯一键为 `(room_id, terminal_commit_id)`。新增一个事务型 Tauri 命令：在同一 SQLite 事务中插入唯一终局记录并应用各真人的胜负增量；若唯一记录已存在则返回原提交结果且不得再次增加场次。不要采用“先写唯一键、再调用现有 upsert”的两段写法，避免进程在两步之间退出造成少记或重复。

- [ ] **Step 4: 实现终局引用校验**

从 `PluginRoomService` 读取宿主已持久化的 terminal commit 和锁定席位；唯一键固定为 `${roomId}\0${terminalCommitId}`，不可由插件替换。宿主验证提交 result 的稳定哈希等于 terminal commit 的 `terminalResultHash`，从而无需解析大富翁状态也能拒绝终局后篡改。

- [ ] **Step 5: 验证并提交**

Run: `npm run test:plugin -- --run tests/plugin/leaderboard-service.test.ts`

Expected: PASS。

Run: `cargo test --manifest-path src-tauri/Cargo.toml plugin_terminal_submission`

Expected: PASS，覆盖重复和事务回滚。

```powershell
git add src/plugin-host/services src-tauri/src/storage.rs src-tauri/src/lib.rs src/services/tauri-api.ts tests/plugin/leaderboard-service.test.ts
git commit -m "fix: bind leaderboard results to terminal commits"
```

## Task 6：把大富翁插件升级为 Vue 3 + TypeScript 应用

**Files:**
- Modify: `plugins/com.lanchat.monopoly/package.json`
- Modify: `plugins/com.lanchat.monopoly/plugin.json`
- Create: `plugins/com.lanchat.monopoly/vite.config.ts`
- Create: `plugins/com.lanchat.monopoly/tsconfig.json`
- Create: `plugins/com.lanchat.monopoly/src/env.d.ts`
- Create: `plugins/com.lanchat.monopoly/src/main.ts`
- Create: `plugins/com.lanchat.monopoly/src/App.vue`
- Create: `plugins/com.lanchat.monopoly/src/styles/monopoly.css`
- Modify: `plugins/com.lanchat.monopoly/public/index.html`
- Modify: `plugins/com.lanchat.monopoly/scripts/build.mjs`
- Create: `plugins/com.lanchat.monopoly/tests/components/app-shell.test.ts`

- [ ] **Step 1: 写 Vue 装载失败测试**

验证插件在模拟 `window.lanchat` 下挂载、没有宿主时显示明确开发提示、进入/退出事件正确释放订阅。清单新增 `devices.read`，保留 rooms、leaderboard、theme、notify、logger 和 private storage 权限。

- [ ] **Step 2: 运行并确认失败**

Run: `npm test --workspace @dumking/lanchat-plugin-monopoly`

Expected: FAIL，尚无 Vue 入口。

- [ ] **Step 3: 添加最小 Vue/Vite 工具链**

开发依赖固定到与主程序兼容的 Vue 3、Vite、TypeScript、Vitest、Vue Test Utils 和 jsdom。`build.mjs` 先执行 Vite build，再把完整 `dist` 交给现有 `.lcp` 打包流程，不能继续手工列举四个 JS/CSS 文件。

- [ ] **Step 4: 实现仅编排的 App.vue**

此步只提供房间列表/房间占位骨架和错误边界，不复制旧大段模板；后续组件按职责接入。

- [ ] **Step 5: 验证和提交**

Run: `npm test --workspace @dumking/lanchat-plugin-monopoly && npm run build --workspace @dumking/lanchat-plugin-monopoly`

Expected: PASS，`dist/index.html` 使用相对资源路径。

```powershell
git add package-lock.json plugins/com.lanchat.monopoly
git commit -m "build: migrate monopoly plugin to vue"
```

## Task 7：迁移确定性规则和房间状态机

**Files:**
- Create: `plugins/com.lanchat.monopoly/src/domain/types.ts`
- Create: `plugins/com.lanchat.monopoly/src/domain/monopoly.ts`
- Create: `plugins/com.lanchat.monopoly/src/domain/monopoly-room.ts`
- Create: `plugins/com.lanchat.monopoly/src/domain/state-hash.ts`
- Create: `plugins/com.lanchat.monopoly/tests/domain/monopoly-rules.test.ts`
- Create: `plugins/com.lanchat.monopoly/tests/domain/monopoly-room.test.ts`
- Create: `plugins/com.lanchat.monopoly/tests/domain/determinism.test.ts`
- Remove after parity: `plugins/com.lanchat.monopoly/src/monopoly.js`
- Remove after parity: `plugins/com.lanchat.monopoly/src/session.js`

- [ ] **Step 1: 从旧测试迁入失败用例**

逐组迁移 `scripts/test-monopoly-rules.mjs`、`scripts/test-monopoly-room.mjs` 和当前插件测试的有效断言，覆盖购买、停留卡升级自有建筑、收费、联排、拆卖、破产、监狱、机场、随机事件、卡牌、神明、路障、机器人和再来一局直接回起点。

- [ ] **Step 2: 运行失败测试**

Run: `npm run test:domain --workspace @dumking/lanchat-plugin-monopoly`

Expected: FAIL，TypeScript 领域模块尚未实现。

- [ ] **Step 3: 迁移纯领域 reducer**

以 `git show d932c7b:src/games/monopoly.ts` 和 `monopolyRoom.ts` 为源，剥离 Pinia、Tauri 和 DOM 依赖。所有入口使用：

```ts
reduceMonopoly(state, command, context: { now: number; random: ExplicitRandomResults }): MonopolyTransition
```

领域代码中加入静态测试，拒绝 `Math.random(` 和 `Date.now(`。

- [ ] **Step 4: 固定稳定哈希**

对对象 key 排序，保留数组顺序，排除纯展示缓存；同一状态不同对象插入顺序必须得到同一 SHA-256，任何业务字段变化必须改变 hash。

- [ ] **Step 5: 做旧新规则等价重放**

用固定命令序列在旧基线和新 reducer 上执行，比较金币、位置、地产、建筑等级、卡牌、神明、待处理状态、日志和终局结果。

- [ ] **Step 6: 验证后删除简化引擎**

Run: `npm run test:domain --workspace @dumking/lanchat-plugin-monopoly`

Expected: PASS。

Run: `rg "Math\.random\(|Date\.now\(" plugins/com.lanchat.monopoly/src/domain`

Expected: 无输出。

- [ ] **Step 7: 提交**

```powershell
git add plugins/com.lanchat.monopoly/src/domain plugins/com.lanchat.monopoly/tests/domain plugins/com.lanchat.monopoly/package.json
git rm plugins/com.lanchat.monopoly/src/monopoly.js plugins/com.lanchat.monopoly/src/session.js
git commit -m "feat: migrate full monopoly rules"
```

## Task 8：接入房主权威适配器、邀请和断线恢复

**Files:**
- Create: `plugins/com.lanchat.monopoly/src/host/lanchat-api.ts`
- Create: `plugins/com.lanchat.monopoly/src/host/room-adapter.ts`
- Create: `plugins/com.lanchat.monopoly/src/host/theme-adapter.ts`
- Create: `plugins/com.lanchat.monopoly/tests/host/room-adapter.test.ts`
- Create: `plugins/com.lanchat.monopoly/tests/host/invite.test.ts`

- [ ] **Step 1: 写双实例失败测试**

创建房主/成员两个隔离实例，成员发送 intent，只有房主 reduce 并 commit；两个实例应用后 revision、深度状态和 hash 一致。再覆盖重复、乱序、缺口、待购地/机场/选人/选地/待付款检查点恢复。

- [ ] **Step 2: 写超时和 presence 失败测试**

覆盖普通成员 60 秒席位保留、30 秒确定动作、房主掉线冻结全部倒计时、60 秒未恢复结束房间、房主恢复后按剩余时长继续。测试使用 fake timer，禁止真实 sleep。

- [ ] **Step 3: 实现 API 薄包装**

每个宿主调用捕获结构化错误，转换为局部错误或 `ui.notify` 中文提示。单机房间发送聊天/事件时，LAN 不可用不得弹“没有可用连接，游戏消息未送达”。

- [ ] **Step 4: 实现 adapter**

adapter 负责 commandId、pending intent、防重复、owner reduce、checkpoint 策略、future commit 缓存、5 秒 recover 和 read-only 状态；不包含 UI 文案和 DOM。

- [ ] **Step 5: 实现邀请竞态测试与逻辑**

覆盖有效邀请、过期、满房、已开局、已解散、协议不兼容和 roomVersion 已变化；加入前必须 `resolveInvite`。

- [ ] **Step 6: 验证和提交**

Run: `npm run test:host --workspace @dumking/lanchat-plugin-monopoly`

Expected: PASS。

```powershell
git add plugins/com.lanchat.monopoly/src/host plugins/com.lanchat.monopoly/tests/host plugins/com.lanchat.monopoly/package.json
git commit -m "feat: connect monopoly authoritative rooms"
```

## Task 9：迁移成熟页面骨架、平面棋盘和真实操作

**Files:**
- Modify: `plugins/com.lanchat.monopoly/src/App.vue`
- Create: `plugins/com.lanchat.monopoly/src/domain/presentation.ts`
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolyBoardFlat.vue`
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolyPlayerCards.vue`
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolyGameCenter.vue`
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolyEventLog.vue`
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolyRoomChat.vue`
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolyAnnouncement.vue`
- Create: `plugins/com.lanchat.monopoly/tests/components/room-actions.test.ts`
- Create: `plugins/com.lanchat.monopoly/tests/components/flat-layout.test.ts`

- [ ] **Step 1: 写全部可见按钮的失败契约测试**

用表驱动测试覆盖创建、加入、准备、取消、开始、投骰、购买、放弃、道具、机器人、移除成员、资产处置、邀请、聊天、再来一局和退出。每个按钮必须满足其一：发出正确 intent/API；有真实 disabled；展示明确原因。

- [ ] **Step 2: 运行并确认失败**

Run: `npm run test:components --workspace @dumking/lanchat-plugin-monopoly`

Expected: FAIL，成熟组件尚未迁入。

- [ ] **Step 3: 先实现 presentation.ts**

集中返回 `{ visible, enabled, reason }`，模板不重复写权限/阶段逻辑。房主人数不足或真人未准备时，“开始”按钮显示具体缺项。

- [ ] **Step 4: 从 e43ef51 迁移页面骨架和平面布局**

用 `git show e43ef51:src/App.vue` 只提取大富翁相关模板与样式结构；所有 store 调用改为 props/emits 或 adapter。不得把旧 App.vue 整体复制进插件。

- [ ] **Step 5: 接通信息模块**

日志使用平面版字号/颜色、单行省略和 title 全文；聊天独立占右下模块且不与对局中心重叠；横幅只显示最新一条，头像/图标/文字单行；监狱玩家卡显示两条对角锁链。

- [ ] **Step 6: 验证真实动作和布局**

Run: `npm run test:components --workspace @dumking/lanchat-plugin-monopoly`

Expected: PASS。

- [ ] **Step 7: 提交**

```powershell
git add plugins/com.lanchat.monopoly/src plugins/com.lanchat.monopoly/tests/components
git commit -m "feat: restore monopoly room interface"
```

## Task 10：迁移伪 3D 棋盘、资源和图层语义

**Files:**
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolyBoard3D.vue`
- Create: `plugins/com.lanchat.monopoly/src/styles/monopoly-3d.css`
- Modify: `plugins/com.lanchat.monopoly/src/App.vue`
- Expand: `plugins/com.lanchat.monopoly/public/assets/monopoly/**`
- Create: `plugins/com.lanchat.monopoly/tests/components/board-3d.test.ts`
- Create: `plugins/com.lanchat.monopoly/tests/components/assets.test.ts`

- [ ] **Step 1: 写 3D 交互失败测试**

覆盖默认 3D、平面/3D 切换不重置状态、60%–220% 缩放、滚轮、拖动、复位、俯视/斜视，以及透明横幅不拦截地块点击。

- [ ] **Step 2: 写资源与地块语义失败测试**

断言建筑贴底；地名在视角可见侧；过路费仅顶层数字无背景；城池名对应边分三段，红色小屋亮 1/3、洋房 2/3、地标 3/3；小金币倍率位于建筑顶部；财神/穷鬼/天使/恶魔/路障为图像且地块上无“财/天”等文字；棋子使用头像小人。

- [ ] **Step 3: 迁移组件和 CSS**

以 `d932c7b:src/components/MonopolyBoard3D.vue` 与 `e43ef51:src/styles/monopoly3d-room.css` 为源，拆出 CSS，保留已修复点击命中层。资源路径统一 `/assets/monopoly/...`，由 Vite base `./` 处理插件安装目录。

- [ ] **Step 4: 补齐资源并验证引用**

资源测试解析构建产物内所有 URL，确保文件存在且没有回指主程序 `/games/monopoly`。

- [ ] **Step 5: 验证和提交**

Run: `npm run test:components --workspace @dumking/lanchat-plugin-monopoly && npm run build --workspace @dumking/lanchat-plugin-monopoly`

Expected: PASS。

```powershell
git add plugins/com.lanchat.monopoly/src plugins/com.lanchat.monopoly/public/assets/monopoly plugins/com.lanchat.monopoly/tests/components
git commit -m "feat: restore monopoly 3d board"
```

## Task 11：迁移弹窗、玩法规则和结算中心

**Files:**
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolyRulesDialog.vue`
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolyTargetDialog.vue`
- Create: `plugins/com.lanchat.monopoly/src/components/MonopolySettlement.vue`
- Create: `plugins/com.lanchat.monopoly/tests/components/dialogs.test.ts`
- Create: `plugins/com.lanchat.monopoly/tests/components/settlement.test.ts`

- [ ] **Step 1: 写弹窗失败测试**

测试玩家/地块/骰点弹窗宽度紧凑，hover、`:focus-visible` 和 selected 同时改变背景、边框与文字色；键盘可达；地块选点点击命中真实 tile。

- [ ] **Step 2: 写规则图和结算失败测试**

规则页必须展示建筑、角落、随机事件、道具与神明图片。结算时玩家卡片和对局中心继续存在；房主可再来一局，其他玩家显示等待；新局所有玩家直接位于起点且 revision 连续。

- [ ] **Step 3: 实现组件并接通 intent**

弹窗确认只发送 intent，不直接改 state。取消未提交目标时不消耗卡牌。结算排行榜只由房主针对 terminal commit 提交一次。

- [ ] **Step 4: 验证和提交**

Run: `npm run test:components --workspace @dumking/lanchat-plugin-monopoly`

Expected: PASS。

```powershell
git add plugins/com.lanchat.monopoly/src/components plugins/com.lanchat.monopoly/tests/components
git commit -m "feat: restore monopoly dialogs and settlement"
```

## Task 12：三种尺寸、四套主题和双客户端验收

**Files:**
- Create: `plugins/com.lanchat.monopoly/tests/e2e/two-client-checklist.md`
- Create: `plugins/com.lanchat.monopoly/tests/visual/README.md`
- Create: `plugins/com.lanchat.monopoly/tests/visual/baseline-manifest.json`
- Modify: `plugins/com.lanchat.monopoly/README.md`

- [ ] **Step 1: 运行插件全量自动测试**

Run: `npm test --workspace @dumking/lanchat-plugin-monopoly`

Expected: PASS，迁移矩阵无未完成项。

- [ ] **Step 2: 运行三仓回归**

Run: `npm run test:plugin && npm run build` in `D:\lanchat\lanchat`

Expected: PASS。

Run: `cargo test --manifest-path src-tauri/Cargo.toml plugin::room_storage::tests` in `D:\lanchat\lanchat`

Expected: PASS。

Run: `npm test && npm run build --workspace @dumking/lanchat-plugin-monopoly` in `D:\lanchat\lanchat-official-plugins`

Expected: PASS。

Run: `npm run check && npm run build && node --test tests/contract.test.mjs` in `D:\lanchat\lanchat-plugin-sdk`

Expected: PASS。

- [ ] **Step 3: 视觉检查**

在 1280×720、1440×900、高 DPI 150% 和四套宿主主题中对照 `e43ef51` 截图。逐项记录棋盘占比、聊天不重叠、底部 50/50、日志行高、横幅单行、资源落地、地名方向、价格和等级边。

- [ ] **Step 4: 双客户端故障注入**

按清单验证 2/3/4 真人和真人+机器人；重复/乱序/短暂丢包；房主和成员进程重启；邀请过期/满房/开局；待购地、机场、道具目标和欠款恢复。每一步记录两端 revision/hash；不一致即停止清理阶段。

- [ ] **Step 5: 提交验收材料**

```powershell
git add plugins/com.lanchat.monopoly/tests plugins/com.lanchat.monopoly/README.md
git commit -m "test: verify monopoly multiplayer migration"
```

## Task 13：验收后清除主程序大富翁业务残留

**Files:**
- Remove: `D:\lanchat\lanchat\src\components\MonopolyBoard3D.vue`
- Remove: `D:\lanchat\lanchat\src\components\MonopolyRoomChat.vue`
- Remove: `D:\lanchat\lanchat\src\games\monopoly.ts`
- Remove: `D:\lanchat\lanchat\src\games\monopolyRoom.ts`
- Remove: `D:\lanchat\lanchat\src\styles\monopoly3d-room.css`
- Remove: `D:\lanchat\lanchat\public\games\monopoly\**`
- Remove: `D:\lanchat\lanchat\scripts\test-monopoly-rules.mjs`
- Remove: `D:\lanchat\lanchat\scripts\test-monopoly-room.mjs`
- Remove: `D:\lanchat\lanchat\scripts\test-monopoly-ui.mjs`
- Remove after copying required visual evidence: `D:\lanchat\lanchat\previews\monopoly-*`
- Modify: `D:\lanchat\lanchat\package.json`
- Create: `D:\lanchat\lanchat\tests\plugin\monopoly-boundary.test.ts`

- [ ] **Step 1: 先写边界失败测试**

扫描主程序 `src`、`public` 和非插件专属 scripts，拒绝 `Monopoly` 业务类型、规则事件名、`games/monopoly` 资源引用和旧入口；允许 `tests/plugin/monopoly-boundary.test.ts` 自身、通用插件清单数据和显示名元数据。

- [ ] **Step 2: 运行并确认当前失败**

Run: `npm run test:plugin -- --run tests/plugin/monopoly-boundary.test.ts`

Expected: FAIL，列出尚存文件。

- [ ] **Step 3: 仅在 Task 12 全部通过后删除残留**

使用 `git rm` 删除上列已跟踪文件，并从 `package.json` 移除三条 Monopoly 专属测试命令；已将必要截图/交互证据写入插件验收目录后，再删除主仓库未跟踪的 `previews/monopoly-*`。不要删除通用游戏排行榜策略、插件目录或邀请卡宿主能力。

- [ ] **Step 4: 全量验证主程序**

Run: `npm run test:plugin && npm run test:plugin-contracts && npm run build`

Expected: PASS。

Run: `cargo test --manifest-path src-tauri/Cargo.toml plugin::`

Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add package.json tests/plugin/monopoly-boundary.test.ts
git add -u src/components/MonopolyBoard3D.vue src/components/MonopolyRoomChat.vue src/games/monopoly.ts src/games/monopolyRoom.ts src/styles/monopoly3d-room.css public/games/monopoly scripts/test-monopoly-rules.mjs scripts/test-monopoly-room.mjs scripts/test-monopoly-ui.mjs
git commit -m "refactor: remove monopoly from core app"
```

## Task 14：生成签名插件包并做安装冒烟测试

**Files:**
- Modify if needed: `scripts/package-plugin.mjs`
- Create locally, do not commit: `artifacts/com.lanchat.monopoly-0.8.0.lcp`
- Create: `plugins/com.lanchat.monopoly/tests/e2e/install-smoke.md`

- [ ] **Step 1: 构建生产插件**

Run: `npm run build --workspace @dumking/lanchat-plugin-monopoly`

Expected: PASS，`dist` 包含 hash 化 JS/CSS 和完整资源。

- [ ] **Step 2: 运行仓库打包测试**

Set: `$env:LANCHAT_PLUGIN_PRIVATE_KEY_FILE='<本机已保存的签名私钥路径>'` and `$env:LANCHAT_PLUGIN_KEY_ID='<对应 key id>'`.

Run: `npm test`

Expected: PASS。

Run: `npm run plugin:package -- plugins/com.lanchat.monopoly artifacts`

Expected: PASS，生成 `com.lanchat.monopoly-0.8.0.lcp`，签名验证成功。

- [ ] **Step 3: 在主程序安装冒烟**

安装包后验证：插件可启用、默认 3D、创建/邀请/加入按钮真实可用、平面切换、退出重进恢复。检查主程序日志无 CSP、资源 404、权限或 bridge schema 错误。

- [ ] **Step 4: 最终三仓状态检查**

Run: `git status --short` in each of the three repositories.

Expected: 仅有明确说明的本地 artifact 或既存未跟踪文件，无未提交产品代码。

- [ ] **Step 5: 提交冒烟记录**

```powershell
git add plugins/com.lanchat.monopoly/tests/e2e/install-smoke.md
git commit -m "docs: record monopoly plugin smoke test"
```

## 完成判定

- 只有 Task 1–14 全部勾选、三仓自动测试通过、视觉矩阵通过、双客户端 revision/hash 一致、签名 `.lcp` 可安装，才可称迁移完成。
- 任一恢复场景、邀请竞态或真实按钮仍失败时，不执行 Task 13 的主程序删除。
- 提交和推送分开；本计划不自动推送。需要推送时分别核对三个仓库的 branch、commit 和 remote。
