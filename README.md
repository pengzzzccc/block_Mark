# 🃏 Block Market

**Block Market** 是一款在线多人回合制经济策略游戏，融合了麻将式方块收集机制。玩家通过掷骰子获得收入，在公开市场购买/交换方块，与其他玩家协商或强制交易，率先凑出 **2 组 Set + 1 对 Pair**（共 8 块）的玩家获胜。

---

## 🎮 游戏规则速览

### 方块系统（56 块）
| 类别 | 颜色 | 数量 | 单价 |
|------|------|------|------|
| **Ordinal（普通）** | 🔴红 🟡黄 🔵蓝 🟢绿 | 4色×4号×3个 = 48块 | $50 |
| **Purple（万能）** | 🟣紫 | 4块 | $120 |
| **Black（防御）** | ⚫黑 | 4块 | $80 |

### 回合流程
1. **结算期**：掷骰子（红骰 R + 绿骰 G）→ 计算收入
   - G∈[1,2] → 个位归0（R=4,G=2 → $40）
   - G∈[3,7] → 个位变5（R=4,G=3 → $45）
   - G∈[8,9] → 进位（R=4,G=8 → $50）
   - 双6 → $70 + 额外行动
2. **行动期**（四选一）：
   - **购买**：公开市场 $50/$80/$120 或 盲抽 $40
   - **交换**：卖回 1 块得 $40 + 补差价换市场方块
   - **协商**：与其他玩家交换方块（可附带现金）
   - **强制交易**：支付目标方块价 120% → 对决决定归属

### 胜利条件（麻将胡牌）
- 8 块 = **2 组 Set** + **1 对 Pair**
- **顺子 (Sequence)**：同色连续 3 块（红1+红2+红3）
- **刻子 (Triplet)**：同色同号 3 块（蓝4×3）
- **彩虹奖励**：4 个不同色同号 = 2 组 Set
- **Purple 万能牌**：可替代任何颜色和数字

---

## 🏗 技术架构

```
┌─────────────────────────────────────────┐
│              AWS EC2                     │
│  ┌─────────────────────────────────┐    │
│  │     Docker Compose               │    │
│  │  ┌──────┐  ┌────────┐  ┌──────┐ │    │
│  │  │Nginx │→ │ Node.js│→ │Redis │ │    │
│  │  │ :80  │  │ :3001  │  │ :6379│ │    │
│  │  └──────┘  └────────┘  └──────┘ │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS + Framer Motion |
| 后端 | Node.js + Express + Socket.IO |
| 状态存储 | Redis（房间和游戏状态） |
| 实时通信 | WebSocket (Socket.IO) |
| 容器化 | Docker + Docker Compose |
| 基础设施 | Terraform → AWS EC2 |

---

## 📁 项目结构

```
block-market/
├── client/                    # React 前端
│   ├── src/
│   │   ├── components/        # UI 组件（13 个）
│   │   │   ├── LobbyPage.tsx       # 大厅页面
│   │   │   ├── WaitingRoom.tsx     # 等待室
│   │   │   ├── GameBoard.tsx       # 游戏主界面
│   │   │   ├── TopBar.tsx          # 顶栏信息
│   │   │   ├── PlayerPanel.tsx     # 对手信息面板
│   │   │   ├── OpenMarket.tsx      # 公开市场
│   │   │   ├── DiceRoller.tsx      # 3D 骰子
│   │   │   ├── MyHand.tsx          # 手牌展示
│   │   │   ├── ActionBar.tsx       # 行动按钮栏
│   │   │   ├── BlockCard.tsx       # 方块卡牌
│   │   │   ├── DuelOverlay.tsx     # 对决界面
│   │   │   ├── NegotiationModal.tsx # 协商弹窗
│   │   │   └── VictoryScreen.tsx   # 胜利画面
│   │   ├── stores/gameStore.ts     # Zustand 状态管理
│   │   ├── hooks/                  # 自定义 hooks
│   │   ├── types/                  # 前端类型
│   │   └── utils/                  # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── server/                    # Node.js 后端
│   ├── src/
│   │   ├── game/              # 核心游戏逻辑
│   │   │   ├── dice.ts            # 骰子系统
│   │   │   ├── blocks.ts          # 方块系统
│   │   │   ├── winCheck.ts        # 胜利判定
│   │   │   ├── duel.ts            # 对决系统
│   │   │   └── turnEngine.ts      # 回合引擎
│   │   ├── socket/            # WebSocket 事件
│   │   │   ├── roomManager.ts     # 房间管理
│   │   │   └── socketHandler.ts   # 事件处理器
│   │   └── index.ts           # 服务器入口
│   └── package.json
├── shared/                    # 共享类型定义
│   └── types.ts
├── docker/                    # Docker 配置
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── nginx.conf
├── terraform/                 # AWS 基础设施
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── docker-compose.yml         # 容器编排
└── package.json               # Monorepo 根配置
```

---

## 🚀 快速开始

### 前提条件
- **Node.js** ≥ 18
- **npm** ≥ 9
- （可选）**Docker Desktop** — 用于生产模式部署
- （可选）**Terraform** — 用于 AWS 部署

### 开发模式（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（客户端 + 服务端）
npm run dev
```

打开 **http://localhost:5173**

- 客户端：Vite 热更新
- 服务端：tsx watch 自动重载
- API / WebSocket：`http://localhost:3001`

### Docker 生产模式

```bash
# 构建镜像并启动所有服务
docker compose up --build

# 后台运行
docker compose up --build -d

# 停止
docker compose down
```

打开 **http://localhost**（Nginx 反向代理，无需端口号）

---

## ☁️ AWS 部署（Terraform）

```bash
cd terraform

# 配置变量（编辑 variables.tf 或使用 terraform.tfvars）
# 必填: key_pair_name, admin_ip, repo_url

terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 获取访问地址
terraform output game_url
```

部署后 EC2 实例上会自动安装 Docker 并启动应用。

---

## 🔌 Socket.IO 事件参考

### 客户端 → 服务端
| 事件 | 说明 |
|------|------|
| `room:create` | 创建房间 |
| `room:join` | 加入房间 |
| `room:leave` | 离开房间 |
| `game:start` | 房主开始游戏 |
| `turn:rollDice` | 掷骰子 |
| `turn:buy` | 购买方块 |
| `turn:swap` | 交换方块 |
| `turn:negotiate` | 发起协商 |
| `turn:negotiateReply` | 回复协商 |
| `turn:forcedTrade` | 发起强制交易 |
| `turn:duelRoll` | 对决掷骰 |

### 服务端 → 客户端
| 事件 | 说明 |
|------|------|
| `room:created` | 房间创建成功 |
| `room:updated` | 房间状态更新 |
| `room:error` | 错误信息 |
| `game:started` | 游戏开始 |
| `game:stateUpdate` | 游戏状态广播 |
| `turn:diceResult` | 骰子结果 |
| `turn:actionResult` | 行动结果 |
| `duel:initiated` | 对决开始 |
| `duel:rolled` | 对决骰子结果 |
| `duel:result` | 对决结果 |
| `negotiate:request` | 协商请求 |
| `negotiate:response` | 协商回复 |
| `game:winner` | 游戏结束 |

---

## 🧪 运行测试

```bash
# 服务端单元测试
npm test --workspace=server

# TypeScript 编译检查
npx tsc --project server/tsconfig.json --noEmit
npx tsc --project client/tsconfig.json --noEmit
```

---

## 🔧 可用命令

```bash
npm run dev              # 开发模式（client + server 同时启动）
npm run dev:client       # 仅启动客户端
npm run dev:server       # 仅启动服务端

docker compose up        # Docker 生产模式
docker compose down      # 停止容器

cd terraform && terraform apply  # 部署到 AWS
```

---

## 📜 许可证

MIT