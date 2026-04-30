# 更新日志 (Changelog)

## v0.3.0 — 2026-05-01

### 🐛 Bug Fixes (Critical)
- **修复回合状态不同步** — 所有 Socket 事件处理器现在在执行操作后将 `gameState` 写回 `room.gameState`，解决了两个玩家看到不同状态、部分按钮无响应的核心问题
- **修复盲抽执行两次** — `turnEngine.ts` 中 `executeBuy` 的盲抽路径被合并为单次执行
- **修复防御方胜出时方块消失** — `duel.ts` 中 `applyDuelResult` 现在在防御方胜出时将方块放回手牌
- **修复骰子收入计算** — `dice.ts` 中无意义的三元表达式被简化

### ✨ Features
- **双6额外行动** — 掷出红6绿6后，当前玩家获得额外一轮行动（不切换玩家）
- **阶段校验** — 所有操作现在验证当前回合阶段（settlement/action），防止非法操作
- **自动掷骰** — 游戏开始时自动为第一个玩家掷骰子

### 🎨 Frontend
- **CSS 视觉增强** — 新增玻璃卡片渐变、金按钮光泽效果、方块渐变色、骰子发光色、6种动画
- **LobbyPage 重设计** — 粒子背景、Playfair Display 大标题、四色方块装饰、网格规则卡片
- **BlockCard 重写** — 修复不存在的 Tailwind 类、紫色闪光边框、黑色金色护盾、内光效果

---

## v0.2.0 — 2026-04-30

### 🐛 Bug Fixes
- **修复 AMI 硬编码错误** — 改为动态查询 Ubuntu 24.04 AMI
- **修复 Dockerfile.server 构建路径** — `server/dist` → `dist/server/src/index.js`
- **修复 Socket 连接地址** — 从硬编码 `localhost:3001` 改为动态检测
- **修复 CORS 配置** — 允许所有来源，移除覆盖的环境变量

### ✨ Features
- **Terraform 部署** — EC2 + 安全组 + 弹性 IP
- **Docker 容器化** — 三容器架构 (client + server + redis)

---

## v0.1.0 — 2026-04-30

### ✨ Initial Release
- 完整游戏逻辑：骰子系统、方块池、胜利判定、回合引擎、对决系统
- WebSocket 实时通信：房间管理、状态同步、手牌可见性控制
- 前端 UI：大厅、等待室、游戏主界面、方块卡牌、骰子动画