# LanChat 官方插件

此仓库承载由 LanChat 团队维护、独立于主程序发布的插件。插件只通过标准 Host API 与主程序交互，不允许引用 `lanchat` 主仓库的内部源码。

## 首批迁移目标

- `com.lanchat.gomoku`：五子棋，作为第一套完整参考插件
- `com.lanchat.xiangqi`：象棋
- `com.lanchat.minesweeper`：扫雷
- `com.lanchat.monopoly`：大富翁（平面与 3D 作为同一插件内的视图）

每个插件独立构建、测试、打包和发布。功能迁移完成后，主程序中的旧入口和旧实现会在同一批次删除。

## 目录约定

```text
plugins/<plugin-id>/
  plugin.json
  package.json
  src/
  public/
  tests/
```
