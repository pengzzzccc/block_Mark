# Block Market 在线游戏 — Cline 开发计划

## 项目概述

将 **Block Market** 桌游（回合制经济策略 + 麻将式收集）实现为一个在线多人网页游戏，并给出使用 Docker 容器化并通过 Terraform 部署到 AWS EC2的所有文件和计划。

---

## 技术架构

```
┌─────────────────────────────────────────────────┐
│                    AWS EC2                       │
│  ┌───────────────────────────────────────────┐   │
│  │           Docker Compose                  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐  │   │
│  │  │ Nginx   │→ │ Backend │→ │  Redis   │  │   │
│  │  │ (前端)  │  │ Node.js │  │ (状态)   │  │   │
│  │  │ :80/443 │  │ :3001   │  │ :6379    │  │   │
│  │  └─────────┘  └─────────┘  └──────────┘  │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

| 层级       | 技术选型                          |
|-----------|----------------------------------|
| 前端       | React 18 + TypeScript + Tailwind CSS + Framer Motion |
| 后端       | Node.js + Express + Socket.IO    |
| 状态存储    | Redis（房间和游戏状态）             |
| 实时通信    | WebSocket (Socket.IO)            |
| 容器化     | Docker + Docker Compose           |
| 基础设施    | Terraform → AWS EC2 + Security Group + Elastic IP |

---

## 阶段划分 & 详细任务

### 阶段 1：项目初始化与基础架构（第 1–2 天）

#### 任务 1.1 — 项目脚手架
```
目标：创建 monorepo 目录结构
输出：可运行的空壳项目

block-market/
├── client/               # React 前端
│   ├── src/
│   │   ├── components/   # UI 组件
│   │   ├── hooks/        # 自定义 hooks
│   │   ├── stores/       # 状态管理 (Zustand)
│   │   ├── types/        # TypeScript 类型定义
│   │   ├── utils/        # 工具函数
│   │   ├── assets/       # 图片、字体、音效
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/               # Node.js 后端
│   ├── src/
│   │   ├── game/         # 游戏逻辑核心
│   │   ├── socket/       # WebSocket 事件处理
│   │   ├── models/       # 数据模型
│   │   └── index.ts
│   └── package.json
├── shared/               # 前后端共享类型
│   └── types.ts
├── docker/
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── nginx.conf
├── docker-compose.yml
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── README.md
```

#### 任务 1.2 — 共享类型定义 (shared/types.ts)
```typescript
// 核心类型清单：
- BlockType: 'ordinal' | 'purple' | 'black'
- BlockColor: 'red' | 'yellow' | 'blue' | 'green' | 'purple' | 'black'
- Block: { id, type, color, number?, price }
- DiceResult: { red: 1-6, green: 1-6, income: number, isDouble6: boolean }
- ActionType: 'buy' | 'swap' | 'negotiate' | 'forcedTrade'
- PlayerState: { id, name, cash, hand: Block[], connected: boolean }
- GameState: { players, currentTurn, openMarket, blindPile, phase, winner }
- DuelResult: { attacker, defender, attackerRoll, defenderRoll, winner, blackBlockUsed }
- RoomState: { roomId, players, gameState, status }
```

#### 任务 1.3 — 后端基础框架
```
实现要点：
- Express 服务器 + Socket.IO 初始化
- Redis 连接 (用于房间/游戏状态持久化)
- 房间管理：创建房间、加入房间、离开房间
- Socket 事件注册框架
```

---

### 阶段 2：核心游戏逻辑（第 3–5 天）

#### 任务 2.1 — 骰子系统 (server/src/game/dice.ts)
```
规则实现：
- rollDice(): 生成 Red(1-6) 和 Green(1-6)
- calculateIncome(red, green):
  - G ∈ [1,2] → 个位归0    (例: R=4, G=2 → $40)
  - G ∈ [3,7] → 个位变5    (例: R=4, G=3 → $45)
  - G ∈ [8,9] → 进位到下一个10 (例: R=4, G=8 → $50)
  - 特殊: 双6 → $70 + 额外行动标记
- 对决掷骰: 直接求和 R+G，检测对子(doubles)
```

#### 任务 2.2 — 方块系统 (server/src/game/blocks.ts)
```
数据初始化：
- Ordinal: 4色 × 4号 × 3个 = 48 块，每块 $50
- Purple: 4 块，每块 $120（万能牌）
- Black: 4 块，每块 $80（防御牌）
- 总计 56 块

功能：
- initBlockPool(): 创建并洗牌完整方块池
- setupOpenMarket(): 从盲抽堆翻出 4 块到公开市场
- replenishMarket(): 购买/交换后自动补充
```

#### 任务 2.3 — 胜利判定 (server/src/game/winCheck.ts)
```
麻将胡牌检测算法：
- 胜利条件: 8 块 = 2个 Set + 1个 Pair
- Set 类型:
  - 顺子 (Sequence): 同色连续 3 块 (如 红1+红2+红3)
  - 刻子 (Triplet): 同色同号 3 块 (如 蓝4×3)
- Pair: 同色同号 2 块
- 彩虹奖励: 4 个不同色同号 = 算作 2 个 Set
- Purple 万能牌: 可替代任何颜色和数字

算法方案: 递归回溯搜索
1. 遍历所有可能的 Pair 选择
2. 对剩余 6 块尝试组合成 2 个 Set
3. 优先检测彩虹 Set（4块不同色同号 = 2 Set）
4. Purple 块需要枚举所有可能的替代值
```

#### 任务 2.4 — 回合流程引擎 (server/src/game/turnEngine.ts)
```
Phase 1 — 结算期:
- 自动掷骰 → 计算收入 → 发放现金
- 双6处理: 标记 extraAction = true

Phase 2 — 行动期 (四选一):
- Buy: 从公开市场买（$50/$80/$120）或盲抽（$40）
- Swap: 卖回 1 块得 $40 → 补差价换公开市场的块
- Negotiate: 发起协商（限 1 块交换，可附带现金）
- Forced Trade: 支付 120% → 对决 → 胜负处理

每次行动后:
- 检查公开市场补充
- 检查胜利条件
- 切换到下一位玩家（或处理额外行动）
```

#### 任务 2.5 — 强制交易 / 对决系统 (server/src/game/duel.ts)
```
流程：
1. 攻击者选择目标玩家和目标方块
2. 验证资金: 需支付目标方块 base_price × 1.2
3. 金额存入"银行"（暂扣）
4. 双方各掷 R+G 求和
5. 检测 Black Block 效果: 防御方持有 → 攻击方总和减半(向下取整)
6. 检测 Doubles: 任一方对子 → 该方即胜（双方都对子 → 攻击方优先或平局重掷）
7. 结算:
   - 攻击胜: 获得目标方块，120% 费用归银行
   - 防御胜: 保留方块 + 获得 120% 费用
```

---

### 阶段 3：WebSocket 实时通信（第 6–7 天）

#### 任务 3.1 — Socket 事件定义
```
客户端 → 服务端:
- room:create        创建房间
- room:join          加入房间
- room:leave         离开房间
- game:start         房主开始游戏
- turn:rollDice      掷骰子
- turn:buy           购买方块
- turn:swap          交换方块
- turn:negotiate     发起协商
- turn:negotiateReply 回复协商
- turn:forcedTrade   发起强制交易
- turn:duelRoll      对决掷骰

服务端 → 客户端:
- room:updated       房间状态更新
- game:started       游戏开始
- game:stateUpdate   游戏状态广播 (含可见性控制)
- turn:diceResult    骰子结果
- turn:actionResult  行动结果
- duel:initiated     对决开始
- duel:result        对决结果
- negotiate:request  协商请求
- negotiate:response 协商回复
- game:winner        游戏结束
```

#### 任务 3.2 — 状态同步与可见性
```
关键设计：模拟"暗手"
- 每位玩家只能看到自己的手牌
- 广播时过滤其他玩家手牌 (只发送数量)
- 公开市场对所有人可见
- 对决时临时公开相关方块
```

---

### 阶段 4：前端 UI 设计与实现（第 8–14 天）

#### 设计方向
```
美学风格：「复古华尔街 × 赌场奢华」
- 色调: 深翡翠绿底 + 金色点缀 + 霓虹红/绿（呼应股市红绿）
- 字体: "Playfair Display"（标题）+ "JetBrains Mono"（数字/金额）
- 质感: 毛毡桌面纹理背景 + 高光金属骰子 + 玻璃拟态卡牌
- 动效: 骰子 3D 翻转、方块滑入手牌、现金飞入、对决闪电特效
```

#### 任务 4.1 — 大厅页面 (LobbyPage)
```
组件:
- Logo + 游戏标题（带金色辉光动画）
- 房间列表（实时更新在线人数）
- 创建房间按钮（输入昵称 + 房间设置）
- 加入房间（输入房间代码）
- 简要规则展示卡片

视觉:
- 全屏深绿背景 + 金色粒子漂浮
- 房间卡片采用玻璃拟态(glassmorphism)
- 按钮: 金色渐变 + hover 发光
```

#### 任务 4.2 — 等待室 (WaitingRoom)
```
组件:
- 玩家头像列表（2-4人）+ 在线状态
- 房间代码展示（可复制）
- 房主"开始游戏"按钮
- 游戏规则速览面板
```

#### 任务 4.3 — 游戏主界面 (GameBoard) ★ 核心
```
布局设计 (全屏):
┌──────────────────────────────────────────────┐
│  顶栏: 回合信息 | 当前玩家 | 回合阶段指示    │
├──────────┬───────────────────┬───────────────┤
│          │                   │               │
│  对手信息 │    中央游戏区      │  对手信息      │
│  (左侧)  │                   │  (右侧)       │
│  玩家2   │  ┌─────────────┐  │  玩家4        │
│  头像    │  │ 公开市场     │  │  头像         │
│  资金    │  │ (4块方块)    │  │  资金         │
│  手牌数  │  └─────────────┘  │  手牌数        │
│          │                   │               │
│          │  ┌─────────────┐  │               │
│          │  │ 骰子区域     │  │               │
│          │  │ 3D 骰子动画  │  │               │
│          │  └─────────────┘  │               │
│          │                   │               │
├──────────┴───────────────────┴───────────────┤
│          对手3信息 (底部上方)                    │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐│
│  │         我的手牌 (展开扇形)               ││
│  │  [红1] [红2] [红3] [蓝4] [紫] ...       ││
│  └──────────────────────────────────────────┘│
├──────────────────────────────────────────────┤
│  行动栏: [购买] [交换] [协商] [强制交易]  💰$350 │
└──────────────────────────────────────────────┘

组件清单:
- TopBar: 回合计数、当前阶段(结算/行动)、计时器
- PlayerPanel: 对手信息卡(头像、名字、资金、手牌数量、Black块标记)
- OpenMarket: 4 个方块卡位，可点击购买
- DiceArea: 3D 骰子组件 + 结果展示 + 收入动画
- MyHand: 扇形手牌展示，可拖拽选择
- ActionBar: 4 个行动按钮 + 当前资金显示
- BlindDrawPile: 牌堆剩余数量指示
```

#### 任务 4.4 — 方块卡牌组件 (BlockCard)
```
设计:
- 尺寸: 80×120px (手牌), 100×150px (市场)
- 正面: 颜色底 + 大号数字 + 方块类型图标
- 背面: 统一深色花纹（对手手牌 / 盲抽堆）
- Purple 块: 彩虹渐变边框 + "W" 标记
- Black 块: 暗金边框 + 盾牌图标
- 动效: hover 浮起、选中发光、获得时飞入手牌
```

#### 任务 4.5 — 骰子组件 (DiceRoller)
```
设计:
- CSS 3D 变换实现骰子翻转动画
- 红色骰子 + 绿色骰子并排
- 掷骰时: 1.5秒旋转动画 → 停在结果面
- 收入计算: 数字弹出 + 金币飞入钱包动画
- 双6 特效: 金色爆炸粒子 + "BONUS!" 文字
```

#### 任务 4.6 — 对决界面 (DuelOverlay)
```
设计:
- 全屏半透明遮罩
- 攻守双方头像对峙（左右分列）
- 中央闪电 VS 标志
- 双方骰子同时滚动
- Black Block 效果: 攻击方数字被砍半的动画
- Doubles 检测: 特殊闪光 + "INSTANT WIN!" 
- 结算: 方块飞向胜者、金币转移动画
```

#### 任务 4.7 — 协商弹窗 (NegotiationModal)
```
设计:
- 弹出式对话框
- 双方各一个交换槽位（展示选中的方块）
- 现金附加输入框
- 提议 / 接受 / 拒绝 按钮
- 倒计时 30 秒自动拒绝
```

#### 任务 4.8 — 胜利画面 (VictoryScreen)
```
设计:
- 全屏金色渐变背景
- 获胜方块组合展开展示
- 标注 Set 和 Pair 的分组
- 金币雨粒子效果
- "WINNER!" 大字 + 玩家名
- "再来一局" / "返回大厅" 按钮
```

#### 任务 4.9 — 响应式适配
```
断点:
- Desktop: ≥1024px (完整布局)
- Tablet: 768-1023px (对手信息折叠)
- Mobile: <768px (纵向堆叠，手牌可滑动)
```

---

### 阶段 5：Docker 容器化（第 15–16 天）

#### 任务 5.1 — Dockerfile.client
```dockerfile
# 多阶段构建
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ .
COPY shared/ ../shared/
RUN npm run build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

#### 任务 5.2 — Dockerfile.server
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production
COPY server/dist/ ./dist/
COPY shared/ ../shared/
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

#### 任务 5.3 — docker-compose.yml
```yaml
version: '3.8'
services:
  client:
    build:
      context: .
      dockerfile: docker/Dockerfile.client
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - server

  server:
    build:
      context: .
      dockerfile: docker/Dockerfile.server
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"

volumes:
  redis-data:
```

#### 任务 5.4 — nginx.conf
```nginx
server {
    listen 80;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;  # SPA 路由
    }

    location /socket.io/ {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";  # WebSocket 支持
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://server:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 阶段 6：Terraform AWS 部署（第 17–18 天）

#### 任务 6.1 — main.tf
```hcl
provider "aws" {
  region = var.aws_region
}

# VPC & 网络（使用默认 VPC 简化）
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# 安全组
resource "aws_security_group" "block_market" {
  name        = "block-market-sg"
  description = "Block Market Game Security Group"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ip]
    description = "SSH (仅管理员)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 实例
resource "aws_instance" "block_market" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.block_market.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    # 安装 Docker
    apt-get update
    apt-get install -y docker.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ubuntu
    
    # 部署应用
    cd /home/ubuntu
    git clone ${var.repo_url} block-market
    cd block-market
    docker compose up -d
  EOF

  tags = {
    Name = "block-market-server"
  }
}

# 弹性 IP
resource "aws_eip" "block_market" {
  instance = aws_instance.block_market.id
  domain   = "vpc"
}
```

#### 任务 6.2 — variables.tf
```hcl
variable "aws_region"     { default = "ap-southeast-2" }  # 悉尼区域
variable "instance_type"  { default = "t3.small" }
variable "ami_id"         { default = "ami-0c2ab3b8efb09f272" }  # Ubuntu 24.04
variable "key_pair_name"  { type = string }
variable "admin_ip"       { type = string }
variable "repo_url"       { type = string }
```

#### 任务 6.3 — outputs.tf
```hcl
output "public_ip"  { value = aws_eip.block_market.public_ip }
output "public_dns" { value = aws_instance.block_market.public_dns }
output "game_url"   { value = "http://${aws_eip.block_market.public_ip}" }
```

#### 任务 6.4 — 部署脚本 (deploy.sh)
```bash
#!/bin/bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
echo "Game URL: $(terraform output -raw game_url)"
```

---

### 阶段 7：测试与优化（第 19–21 天）

#### 任务 7.1 — 单元测试
```
覆盖范围:
- dice.test.ts: 收入计算（所有取整分支 + 双6）
- winCheck.test.ts: 胜利判定（顺子/刻子/对子/彩虹/万能牌组合）
- duel.test.ts: 对决流程（Black块减半、Doubles即胜、结算逻辑）
- blocks.test.ts: 方块池初始化、市场补充
```

#### 任务 7.2 — 集成测试
```
场景:
- 完整游戏流程: 创建房间 → 加入 → 开始 → 多回合 → 胜利
- 断线重连: 玩家掉线后重新加入恢复状态
- 并发操作: 多个协商/强制交易同时发起
```

#### 任务 7.3 — 性能优化
```
- 前端: React.memo 减少重渲染、动画 GPU 加速、图片懒加载
- 后端: Socket 事件节流、Redis Pipeline 批量操作
- 网络: Nginx gzip 压缩、静态资源缓存头
```

---

## 里程碑总览

| 里程碑 | 天数 | 交付物 |
|-------|------|--------|
| M1 项目骨架 | Day 1-2 | 可运行的空壳项目 + 类型定义 |
| M2 游戏核心 | Day 3-5 | 骰子/方块/胜利判定/回合引擎/对决 全部可用 |
| M3 实时通信 | Day 6-7 | 多人房间 + 状态同步 + 可见性控制 |
| M4 前端完整 | Day 8-14 | 所有页面和组件 + 动画 + 响应式 |
| M5 容器化 | Day 15-16 | Docker 一键启动整个应用 |
| M6 云部署 | Day 17-18 | Terraform 一键部署到 AWS EC2 |
| M7 测试上线 | Day 19-21 | 测试通过 + 性能优化 + 可公开访问 |

---

## Cline 提示词模板

开发时在 Cline 中使用以下分步提示：

```
Step 1: "初始化 block-market 项目，创建 monorepo 结构，
        安装 React+Vite+TypeScript+Tailwind(client) 和
        Node+Express+Socket.IO+TypeScript(server)，
        创建 shared/types.ts 并定义所有游戏类型。"

Step 2: "实现 server/src/game/dice.ts — 骰子系统，
        包括收入取整规则和双6奖励。编写对应测试。"

Step 3: "实现 server/src/game/blocks.ts — 方块初始化、
        公开市场管理、盲抽逻辑。"

Step 4: "实现 server/src/game/winCheck.ts — 麻将式胡牌判定，
        支持顺子、刻子、对子、彩虹组合、Purple万能牌。"

Step 5: "实现 server/src/game/turnEngine.ts 和 duel.ts — 
        回合流程引擎和强制交易对决系统。"

Step 6: "实现 Socket.IO 事件层 — 房间管理和游戏状态广播，
        注意手牌可见性控制。"

Step 7: "构建前端大厅页面和等待室 — 
        复古华尔街美学，glassmorphism 卡片，金色辉光按钮。"

Step 8: "构建游戏主界面布局 — GameBoard 组件，
        包括对手面板、公开市场、手牌区、行动栏。"

Step 9: "实现 BlockCard、DiceRoller、DuelOverlay、
        NegotiationModal、VictoryScreen 组件及其动画。"

Step 10: "创建 Docker 多阶段构建文件和 docker-compose.yml，
         配置 Nginx 反向代理，确保本地 docker compose up 可运行。"

Step 11: "编写 Terraform 配置 — EC2 + 安全组 + 弹性IP + 
         user_data 自动部署脚本，区域选 ap-southeast-2。"

Step 12: "编写单元测试和集成测试，优化性能，
         确保完整游戏流程可走通。"
```
