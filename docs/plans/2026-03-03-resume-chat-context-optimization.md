# Resume Chat 上下文优化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化简历聊天上下文的传递策略，只保留"会影响当前优化决策"的上下文，减少 token 消耗并提高 AI 响应质量。

**Architecture:** 简历从前端传递，每5次聊天调用 AI 生成会话摘要替换完整历史。

**Tech Stack:** TypeScript, Supabase, Next.js API Routes, AI SDK

---

## Task 1: 数据库迁移 - 添加会话摘要字段

**Files:**
- Create: `supabase/migrations/TIMESTAMP_add_chat_session_summary.sql`

**Step 1: 创建数据库迁移**

```sql
ALTER TABLE public.resume_chat_sessions 
ADD COLUMN IF NOT EXISTS conversation_summary TEXT;
```

**Step 2: 手动更新类型定义**

只添加 `conversation_summary` 字段到 `types/supabase.ts` 中的 `resume_chat_sessions` 表定义：

```typescript
// 在 types/supabase.ts 中找到 resume_chat_sessions 表定义，添加：
conversation_summary: string | null
```

**Step 3: 运行迁移**

```bash
pnpm supabase db push
```

**Step 4: 提交**

```bash
git add supabase/migrations/ types/supabase.ts
git commit -m "feat: add conversation_summary field to chat session"
```

---

## Task 2: 更新 chat-history.ts

**Files:**
- Modify: `lib/agent/chat-history.ts`

**Step 1: 添加类型定义**

```typescript
export interface SessionSummary {
  id: string
  title: string | null
  resumeId: string
  status: ChatSessionStatus
  createdAt: string
  updatedAt: string
  messageCount: number
  conversationSummary?: string
}
```

**Step 2: 添加更新函数**

```typescript
export async function updateConversationSummary(
  sessionId: string,
  summary: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("resume_chat_sessions")
    .update({ conversation_summary: summary })
    .eq("id", sessionId)

  if (error) {
    console.error("Failed to update conversation summary:", error)
    throw new Error(`Failed to update summary: ${error.message}`)
  }
}

export async function getMessageCount(sessionId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from("resume_chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("truncated", false)

  if (error) {
    console.error("Failed to get message count:", error)
    return 0
  }

  return count ?? 0
}
```

**Step 3: 更新 getSessionSummary 函数**

添加 `conversationSummary` 字段。

**Step 4: 提交**

```bash
git add lib/agent/chat-history.ts
git commit -m "feat: add conversation summary functions"
```

---

## Task 3: 创建会话摘要生成模块

**Files:**
- Create: `lib/agent/conversation-summary.ts`

**Step 1: 创建摘要生成逻辑**

```typescript
import { streamText } from "ai"
import { model } from "@/lib/agent/model"

const SUMMARY_PROMPT = `你是一个简历优化会话摘要助手。请分析以下简历优化聊天记录，生成一段简洁的摘要。

要求：
1. 总结用户的主要优化目标和需求
2. 记录已完成的优化内容
3. 记录当前简历存在的问题
4. 保持简洁，不超过 300 字

聊天记录：
{{messages}}

请直接输出摘要，不要有额外格式。`

export async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const messagesText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n")

  const prompt = SUMMARY_PROMPT.replace("{{messages}}", messagesText)

  const result = await streamText({
    model,
    messages: [{ role: "user", content: prompt }],
    maxTokens: 500
  })

  let summary = ""
  for await (const chunk of result.textStream) {
    summary += chunk
  }

  return summary.trim() || "暂无摘要"
}
```

**Step 2: 提交**

```bash
git add lib/agent/conversation-summary.ts
git commit -m "feat: add AI conversation summary generation"
```

---

## Task 4: 修改聊天 API 路由

**Files:**
- Modify: `app/api/chat/resume/route.ts`

**Step 1: 修改上下文构建逻辑**

```typescript
import { 
  getSessionSummary, 
  loadHistory, 
  saveMessage, 
  updateMessage,
  updateConversationSummary,
  getMessageCount
} from "@/lib/agent/chat-history"
import { generateConversationSummary } from "@/lib/agent/conversation-summary"

const RECENT_MESSAGE_LIMIT = 3  // 保留最近3条消息

const session = await getSessionSummary(sessionId)

// 加载最近3条消息用于连续对话（如"请继续"）
const recentMessages = await loadHistory(sessionId, { limit: RECENT_MESSAGE_LIMIT })

// 构建系统消息，传递会话摘要
const systemMessage = {
  id: "system",
  role: "system",
  parts: [
    {
      type: "text",
      text: chatPrompt.format({
        resume: JSON.stringify(resumeData),
        jobDescription: jobDescription,
        evaluationReport: evaluationReport,
        language: resumeLang,
        conversationSummary: session?.conversationSummary || ""
      })
    }
  ],
  createdAt: new Date().toISOString()
} as UIMessage

// 构建完整消息列表：系统消息 + 最近3条 + 当前消息
const allMessages: UIMessage[] = [
  systemMessage,
  ...recentMessages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
    createdAt: msg.createdAt
  })),
  message
]
```

**Step 2: 每5次聊天生成摘要**

```typescript
onFinish: async ({ messages: finishedMessages }) => {
  // 现有保存消息逻辑...

  // 检查消息数量，每5次生成摘要
  const messageCount = await getMessageCount(sessionId)
  
  if (messageCount > 0 && messageCount % 5 === 0) {
    // 获取所有消息用于生成摘要
    const historyForSummary = await loadHistory(sessionId, { limit: 100 })
    const messagesForAI = historyForSummary.map((msg) => {
      const textPart = msg.parts.find((p) => p.type === "text")
      return {
        role: msg.role,
        content: textPart?.type === "text" ? textPart.text : ""
      }
    })
    
    const newSummary = await generateConversationSummary(messagesForAI)
    await updateConversationSummary(sessionId, newSummary)
  }
}
```

**Step 4: 更新提示词模板**

修改 `server/ai/prompts/resume-chat.prompt.ts` 添加 `conversationSummary` 参数。

**Step 5: 提交**

```bash
git add app/api/chat/resume/route.ts server/ai/prompts/resume-chat.prompt.ts
git commit -m "feat: implement AI conversation summary every 5 messages"
```

---

## Task 5: 运行 lint 和类型检查

**Step 1: 运行 lint**

```bash
pnpm lint
```

**Step 2: 运行类型检查**

```bash
pnpm typecheck
```

**Step 3: 提交**

```bash
git add -A
git commit -m "fix: lint and typecheck fixes"
```

---

## 总结

| 上下文类型 | 传递方式 |
|-----------|----------|
| 当前简历 | ✅ 从数据库获取 |
| 目标 JD | ✅ 从数据库获取 |
| 会话摘要 | ✅ AI 生成，每5条消息更新 |
| 最近3条消息 | ✅ 保留用于连续对话 |
| 更早的历史 | ❌ 不再传递 |

**触发条件：** 每5次消息交互后，调用 AI 生成会话摘要。

**上下文结构：**
```
系统消息（简历+JD+摘要） + 最近3条消息 + 当前消息 → AI
```
