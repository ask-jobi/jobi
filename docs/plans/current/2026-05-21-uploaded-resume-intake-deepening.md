# Uploaded Resume intake Module Deepening

**Date:** 2026-05-21

## 背景

当前 `Uploaded Resume` 主链路由 `app/api/resume/upload-and-analyze/route.ts` 直接编排：上传文件、抽取文本、解析 `Application Resume`、创建 `Job Application`、生成 `Evaluation Report`、处理 quota、发 SSE 步骤、失败回滚。

这让 route 这个 Module 的 Interface 很薄，但 Implementation 很重。删除 `processFile()` 后复杂度不会消失，只会散回其它调用方，说明当前缺少真正深的 intake Module。

相关上下文：

- `CONTEXT.md`
- `docs/app-architecture.md`
- `docs/plans/current/2026-05-20-ai-subsystem-defect-fixes.md`

## 目标

- 将 `Uploaded Resume` → `Application Resume` 的 intake 流程收敛为一个深 Module
- 分离 HTTP/SSE Adapter 与领域流程编排
- 统一 quota、rollback、步骤事件、落库与评估触发规则
- 为后续 OCR、异步评估、重试与可观测性预留稳定 Seam

## 非目标

- 本计划不改变当前上传入口 URL 或页面交互
- 本计划不切换 PDF 解析方案
- 本计划不引入完整的后台异步任务系统
- 本计划不在本轮重做 `Evaluation Report` 结构

## 代码现状

| 文件 | 当前职责 |
|---|---|
| `app/api/resume/upload-and-analyze/route.ts` | intake 主编排、SSE、步骤推进 |
| `server/ai/tools.ts` | PDF 文本抽取 |
| `server/ai/resume-parser.ts` | resume text → `Application Resume` parse |
| `server/resume.ts` | 上传文件、创建 `Application Resume` / `Job Application` |
| `server/evaluation.ts` | 生成并保存 `Evaluation Report` |
| `server/quota.ts` | token quota 与 `Job Application` 数量限制 |
| `server/rollback.ts` | 失败回滚上下文 |
| `server/sse/writer-manager.ts` | SSE writer 注册与发送 |

## 已确认决策

- intake 主链路仍以同步请求 + SSE 进度形式对外暴露
- `Application Resume` 与 `Evaluation Report` 的创建顺序需要明确且可回滚
- route 应作为 Adapter，而不是拥有领域流程的 Module

## 建议方案

### 1. 抽出统一 intake orchestration Module

由该 Module 统一拥有：

- 文件校验
- 文本抽取
- resume parse
- quota 检查与消费
- `Application Resume` / `Job Application` 创建
- `Evaluation Report` 生成
- rollback 编排
- 步骤事件输出

### 2. SSE 改为纯步骤事件 Adapter

让 route 只负责：

- 接收请求
- 订阅 intake 步骤事件
- 将步骤事件转发为 SSE
- 返回最终成功或失败

### 3. 明确 intake Interface

统一定义：

- 输入：上传文件、`Job Description` 初始信息、用户上下文
- 输出：`Application Resume`、`Job Application`、当前 `Evaluation Report`、步骤事件
- 失败模式：校验失败、抽取失败、parse 失败、落库失败、评估失败、回滚失败

## 任务清单

### Phase 1: 盘点主链路与失败模式

- [ ] 盘点当前 intake 所有步骤与顺序依赖
- [ ] 列出所有失败模式与回滚点
- [ ] 明确哪些步骤属于领域流程，哪些只是 HTTP/SSE Adapter

### Phase 2: 提炼 intake Module

- [ ] 新建统一 intake orchestration Module
- [ ] 收口步骤状态与步骤事件类型
- [ ] 将 quota / parse / create / evaluate / rollback 串联进统一 Interface
- [ ] 为最终结果定义稳定返回类型

### Phase 3: 缩窄 route 职责

- [ ] `upload-and-analyze/route.ts` 改为调用 intake Module
- [ ] route 中移除主要流程编排逻辑
- [ ] SSE writer 仅负责事件转发

### Phase 4: 测试与回归

- [ ] 覆盖 PDF 类型校验失败
- [ ] 覆盖文本抽取为空
- [ ] 覆盖 parse 失败触发回滚
- [ ] 覆盖 `Evaluation Report` 生成失败触发回滚
- [ ] 覆盖成功链路的步骤顺序与最终返回

## 测试计划

### 单元 / 集成测试

- [ ] intake Module 成功返回 `Application Resume`、`Job Application`、`Evaluation Report`
- [ ] quota 不足时在正确步骤失败
- [ ] rollback 顺序与副作用正确
- [ ] SSE 步骤事件顺序稳定

### 回归检查

- [ ] Dashboard 上传 PDF 分支正常工作
- [ ] 中文/英文 PDF 均可创建 `Application Resume`
- [ ] 上传成功后跳转到 `/application/[applicationId]`
- [ ] 首次进入 resume 页时已能看到当前 `Evaluation Report`

## 风险

- intake 涉及文件、数据库、LLM、SSE、回滚，多副作用收口时容易遗漏旧行为
- 若步骤事件与真实流程解耦不清，前端进度显示可能回归
- 若 rollback Interface 不够明确，后续加异步步骤会继续泄漏复杂度

## 验收标准

- 上传主链路的领域编排由一个统一 Module 拥有
- route 只保留 HTTP/SSE Adapter 职责
- 成功、失败、回滚、步骤事件都能通过统一 Interface 测试
- 后续新增 OCR、异步评估或重试时，不需要继续向 route 堆积实现细节
