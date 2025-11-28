# 快速开始指南 - Mirror Agent 系统

## 🚀 部署前清单

### 1. 数据库迁移
```bash
# 生成并执行迁移，创建新的 interview_session, agent, agentMessage 表
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 2. 环境变量配置
确保 `.env.local` 或环境中包含：
```
OPENAI_API_KEY=sk-xxxx...
OPENAI_MODEL=gpt-4o-mini
```

### 3. 测试流程
```
1. 登录到应用
2. 在主页点击 "Start Interview" 或访问 /interview
3. 回答 9 个心理学问题
4. 自动重定向到与 Agent 的聊天页面
5. 与镜像智能体对话
```

## 📂 关键文件位置

| 功能 | 文件位置 |
|------|---------|
| 前端 Hook（面试管理） | `src/hooks/use-interview-engine.ts` |
| 前端 Hook（聊天管理） | `src/hooks/use-agent-chat.ts` |
| Agent 2 UI 组件 | `src/components/immersive-interview.tsx` |
| Agent 1 UI 组件 | `src/components/agent-chat.tsx` |
| Agent 2 页面 | `src/app/[locale]/interview/page.tsx` |
| Agent 1 页面 | `src/app/[locale]/agent-chat/[agentId]/page.tsx` |
| 面试 API | `src/app/api/interview/*` |
| Agent API | `src/app/api/agent/*` |
| 数据库 Schema | `src/lib/db/schema.ts` |

## 🔧 API 端点参考

### 面试流程
```
POST /api/interview/start
  → 创建会话并返回第一个问题

POST /api/interview/parse-response
  → 解析用户答案并提取字段

POST /api/interview/next-question
  → 基于缺失字段生成下一问题

POST /api/interview/build-agent
  → 构建镜像智能体
```

### Agent 对话
```
GET /api/agent/[agentId]
  → 获取 Agent 信息和消息历史

POST /api/agent/[agentId]/chat
  → 发送消息给 Agent 并获取响应

POST /api/agent/generate-message
  → 生成初始问候（内部使用）
```

## 🎨 UI 自定义点

### 发光水晶体效果
位置：`src/components/immersive-interview.tsx` > `GlowingCrystal()` 函数
- 修改 `rotateX` 和 `rotateY` 变量以改变旋转速度
- 调整 `backgroundColor` 中的颜色值（目前使用 cyan 和 blue）
- 修改 `blur` 值改变发光强度

### 背景粒子效果
位置：`src/components/immersive-interview.tsx` > `ParticleEffect()` 函数
- `Array.from({ length: 20 })` - 改变粒子数量
- `duration` 动画持续时间
- `opacity` 和 `y` 的动画值

### 颜色主题
- 背景：使用 Tailwind 的 `slate-950/900/800` 等
- 主要色调：`primary` 和 `cyan-500`
- 编辑 Tailwind 配置或使用 CSS 变量

## 🧪 常见测试场景

### 测试 1：完整面试流程
1. 点击 "Start Interview"
2. 为每个问题提供至少一个单词的答案
3. 验证进度条更新
4. 验证自动重定向到聊天页面

### 测试 2：Field 提取验证
1. 提交一个包含情感词语的答案（如"very sad"）
2. 检查 emotion 字段是否被填充
3. 检查数据库中的 interview_session 记录

### 测试 3：Agent 对话
1. 在聊天页面发送消息
2. 验证 AI 响应基于用户心理学档案
3. 检查消息是否被保存到 agentMessage 表

### 测试 4：错误处理
1. 尝试在未登录状态下访问 /interview
2. 测试 OpenAI API 失败场景
3. 验证错误信息正确显示

## 🔐 安全考虑

✅ 所有 API 端点都需要 better-auth 认证  
✅ 用户只能访问自己的 Agent 和消息  
✅ 敏感数据（如系统提示词）仅在必要时返回  
❌ 需要添加：速率限制、输入验证、OpenAI API 成本控制  

## 📊 性能优化建议

1. **消息加载**：添加分页而不是一次加载所有消息
2. **缓存**：缓存 Agent 信息以减少数据库查询
3. **流式响应**：使用 OpenAI 的流式 API 进行更快的响应
4. **图像优化**：为不同屏幕尺寸优化 Avatar 图像
5. **CDN**：使用 CDN 加速静态资源

## 🐛 调试技巧

### 启用日志
```typescript
// 在 API 路由中
console.log('Interview start:', { userId, sessionId });
```

### 检查 OpenAI 调用
```typescript
// 查看实际发送给 OpenAI 的 messages
console.log('Messages to OpenAI:', JSON.stringify(messages, null, 2));
```

### 验证数据库记录
```sql
SELECT * FROM interview_session ORDER BY created_at DESC LIMIT 5;
SELECT * FROM agent ORDER BY created_at DESC LIMIT 5;
SELECT * FROM agent_message WHERE agent_id = '...' ORDER BY created_at;
```

## 📈 监控指标

建议追踪的指标：
- 面试完成率
- 平均面试完成时间
- Agent 消息交互数
- OpenAI API 成本和延迟
- 用户留存率

## 🚨 已知限制

1. **并发问题** - 同时的 parse 请求可能导致竞态条件
2. **令牌限制** - 长对话历史可能超过 OpenAI 令牌限制
3. **数据丢失** - 面试中断时会话数据可能丢失
4. **语言支持** - 目前优化为英文，其他语言需测试

## 🤝 贡献指南

添加新功能时：
1. 先更新数据库 schema（如需要）
2. 创建新的 API 端点
3. 创建相应的 Hook（如需要）
4. 创建/更新 UI 组件
5. 添加错误处理和日志
6. 更新此文档

---

**更详细信息见** `MIRROR_AGENT_IMPLEMENTATION.md`
