# Mirror Agent 实现文档

## 概述

已完全实现一个沉浸式心理学面试系统，用于构建"镜像智能体"（Mirror Agent）。系统包括两个主要页面：

1. **Agent 2（提问页面）** - 沉浸式面试引导体验
2. **Agent 1（聊天页面）** - 与镜像智能体的对话

## 架构概览

```
用户流程：
主页 → 点击"Start Interview" → Agent 2 (沉浸式提问) 
  → 回答9个心理学问题 
  → 构建 Agent 1 → Agent 1 聊天页面
```

## 已实现的功能

### 1. 数据库 Schema 扩展

在 `src/lib/db/schema.ts` 中添加了三个新表：

#### `interviewSession` 表
- 存储面试会话的状态和收集的数据
- 字段包括：
  - 9个必要心理学字段（emotion, trigger, expectation, value, thinking_pattern, core_belief, sensitivity, pain_point, relationship_pattern）
  - 当前问题和对话历史
  - 会话状态（in_progress/completed/abandoned）

#### `agent` 表
- 存储构建的镜像智能体信息
- 包含系统提示词和所有心理学字段
- 与用户和面试会话关联

#### `agentMessage` 表
- 存储智能体与用户的所有对话消息
- 区分角色（user/assistant）和时间戳

### 2. 前端 Hooks

#### `useInterviewEngine` (src/hooks/use-interview-engine.ts)
完整的面试流程管理 Hook，功能包括：
- **状态管理**：当前问题、收集的字段、对话历史
- **自动初始化**：组件挂载时获取第一个问题
- **动态问题生成**：根据缺失字段智能生成下一个问题
- **字段提取**：调用 OpenAI 从用户回答中解析心理学信息
- **完成检测**：所有字段收集完成后自动构建 Agent
- **错误处理和加载状态**

```typescript
const {
  currentQuestion,        // 当前问题文本
  collectedFields,        // 已收集的心理学字段对象
  isLoading,             // 加载状态
  error,                 // 错误信息
  isComplete,            // 是否完成
  submitAnswer,          // 提交答案函数
  getProgress,           // 获取进度百分比
} = useInterviewEngine();
```

#### `useAgentChat` (src/hooks/use-agent-chat.ts)
管理与镜像智能体的对话，功能包括：
- 加载 Agent 和消息历史
- 发送消息并获取 AI 响应
- 自动保存对话到数据库
- 会话清空功能

### 3. UI 组件

#### `ImmersiveInterview` (src/components/immersive-interview.tsx)
完整的沉浸式提问 UI，包含：

**视觉效果**：
- 🪞 **发光水晶体**：旋转发光的 3D 效果
  - 多层渐变色和阴影
  - 连续的旋转和缩放动画
  - 光线射线效果

- **背景动画**：
  - 柔光渐变效果（Framer Motion 动画）
  - 浮动粒子效果（20 个随机粒子）
  - 细微网格纹理覆盖层
  - 颜色：深蓝色主题（slate-950/900）

- **聊天气泡动效**：
  - 淡入淡出动画
  - 上浮效果
  - 渐变阴影和边框

**交互功能**：
- 进度指示条（百分比和视觉条）
- 实时问题显示
- 用户输入框
- 已收集字段的显示
- 错误处理显示
- 加载状态指示

#### `AgentChat` (src/components/agent-chat.tsx)
与镜像智能体的对话 UI，包含：
- 对话历史消息滚动显示
- 用户和 AI 消息的不同样式
- 实时加载指示
- 重置对话按钮
- Agent 头部展示（名称和头像）

### 4. 后端 API 端点

#### `/api/interview/start` [POST]
初始化面试会话
- 创建 `interviewSession` 记录
- 返回第一个问题
- 需要用户认证

#### `/api/interview/next-question` [POST]
生成下一个问题
- 基于已收集的字段确定缺失字段
- 使用 OpenAI API 生成符合心理学的问题
- 返回进度信息

请求体：
```json
{
  "collectedFields": { /* 已收集的字段 */ }
}
```

#### `/api/interview/parse-response` [POST]
解析用户回答并提取信息
- 调用 OpenAI 从自然语言中提取心理学字段
- 返回结构化的数据

请求体：
```json
{
  "userResponse": "用户的回答",
  "currentQuestion": "当前问题",
  "collectedFields": { /* 已收集的字段 */ }
}
```

响应：
```json
{
  "extractedFields": { /* 新提取的字段 */ }
}
```

#### `/api/interview/build-agent` [POST]
完成面试并构建镜像智能体
- 生成系统提示词（包含所有心理学信息）
- 创建 `agent` 记录
- 更新会话状态为 completed
- 返回 agentId

请求体：
```json
{
  "sessionId": "会话ID",
  "collectedFields": { /* 完整的字段 */ }
}
```

#### `/api/agent/[agentId]` [GET]
获取智能体信息和消息历史
- 返回 Agent 元数据
- 返回所有历史消息

#### `/api/agent/[agentId]/chat` [POST]
与智能体进行对话
- 保存用户消息
- 调用 OpenAI 生成响应
- 保存 AI 响应
- 返回消息内容

请求体：
```json
{
  "userMessage": "用户消息",
  "conversationHistory": [ /* 对话历史 */ ]
}
```

#### `/api/agent/generate-message` [POST]
生成初始问候或消息（辅助端点）

### 5. 页面路由

#### `/interview` 
- 组件：`src/app/[locale]/interview/page.tsx`
- 显示沉浸式提问 UI
- 面试完成后重定向到 Agent 聊天页面

#### `/agent-chat/[agentId]`
- 组件：`src/app/[locale]/agent-chat/[agentId]/page.tsx`
- 显示与镜像智能体的对话界面
- 加载特定 Agent 的信息

### 6. OpenAI 集成

**问题生成 Prompt**：
- 基于已收集字段生成相关的下一个问题
- 考虑用户的心理学背景
- 生成温暖、同情的开放式问题

**字段提取 Prompt**：
- 从用户回答中识别心理学相关信息
- 返回结构化的 JSON 对象
- 只提取显式或明确暗示的信息

**Agent 系统提示词**：
- 包含用户的完整心理学档案
- 定义 Agent 作为"镜像自我"的角色
- 包含具体的沟通风格指导
- 提及可以帮助用户处理的具体主题

## 技术栈

- **前端框架**：Next.js 15 with App Router
- **UI 库**：React 19 + Tailwind CSS 4 + shadcn/ui
- **动画**：Framer Motion
- **数据库**：PostgreSQL + Drizzle ORM
- **认证**：better-auth
- **AI**：OpenAI API (GPT-4o-mini)
- **HTTP 客户端**：Fetch API (浏览器原生)
- **工具函数**：nanoid (ID 生成)

## 使用流程

### 1. 用户登录
用户必须已通过认证（通过 better-auth 系统）

### 2. 启动面试
点击"Start Interview"按钮进入 `/interview` 页面

### 3. 回答问题
- 系统逐次展示 9 个心理学问题
- 用户在沉浸式 UI 中输入答案
- 每次提交后：
  1. 解析答案提取信息
  2. 确定是否需要继续
  3. 生成下一问题（如需要）或构建 Agent

### 4. 与 Agent 对话
- 面试完成后自动重定向到聊天页面
- 用户可以与镜像智能体进行无限对话
- 所有消息都被保存到数据库

## 数据库迁移

需要运行 Drizzle 迁移来创建新表：

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## 环境变量要求

```
OPENAI_API_KEY=你的_OpenAI_API_密钥
OPENAI_MODEL=gpt-4o-mini  # 默认值
DATABASE_URL=你的_PostgreSQL_连接字符串
```

## 功能特性总结

✅ **AI 驱动的动态问题生成** - 根据已收集的数据生成个性化问题  
✅ **自动字段提取** - 从自然语言中提取结构化心理学信息  
✅ **完整的会话管理** - 保存面试进度和对话历史  
✅ **个性化 Agent 构建** - 基于用户信息生成定制化系统提示词  
✅ **多轮对话** - 用户可与 Agent 进行持续对话  
✅ **沉浸式 UI/UX** - 发光水晶体、动画效果、柔光背景  
✅ **完整认证集成** - 基于 better-auth 的用户会话管理  
✅ **错误处理** - 完善的错误检测和用户提示  
✅ **进度追踪** - 实时显示面试进度百分比  

## 下一步可能的改进

1. **图像生成** - 为每个 Agent 生成个性化头像
2. **音频支持** - 添加语音输入和输出
3. **多语言支持** - 利用现有的 next-intl 系统
4. **面试模板** - 为不同场景创建不同的面试问卷
5. **分析面板** - 显示用户心理学档案的可视化
6. **导出功能** - 导出面试数据和 Agent 信息
7. **团队协作** - 多用户可以创建和共享 Agent
8. **Agent 微调** - 允许用户调整 Agent 的系统提示词

## 文件结构

```
src/
├── app/
│   └── [locale]/
│       ├── interview/
│       │   └── page.tsx              # Agent 2 页面
│       ├── agent-chat/
│       │   └── [agentId]/
│       │       └── page.tsx          # Agent 1 页面
│       └── page.tsx                  # 主页（已更新）
├── api/
│   ├── interview/
│   │   ├── start/route.ts
│   │   ├── next-question/route.ts
│   │   ├── parse-response/route.ts
│   │   └── build-agent/route.ts
│   └── agent/
│       ├── [agentId]/route.ts
│       ├── [agentId]/chat/route.ts
│       └── generate-message/route.ts
├── components/
│   ├── immersive-interview.tsx      # Agent 2 UI 组件
│   └── agent-chat.tsx               # Agent 1 UI 组件
├── hooks/
│   ├── use-interview-engine.ts      # 面试流程管理
│   └── use-agent-chat.ts            # 聊天管理
└── lib/
    └── db/
        └── schema.ts                 # 新增表定义
```

## 测试建议

1. **单元测试** - Hook 和 API 逻辑
2. **集成测试** - 完整的面试到聊天流程
3. **UI 测试** - 动画和交互响应
4. **API 测试** - OpenAI 集成和错误处理
5. **数据库测试** - 消息持久化和检索
