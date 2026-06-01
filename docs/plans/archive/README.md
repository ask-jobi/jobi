# Archived Plans

已完成的 plan。这些是**历史记录**，不再作为活跃参考源。检索代码或设计决策时不应依赖此目录中的内容。

## 归档规则

- 已完整落地 → 更新为结果记录
- 已被后续 plan 取代 → 标注 `⚠️ 已过期（superseded）`，指明取代者
- 被放弃 → 标注失效原因和日期

## 文件索引

### 已过期（superseded）
| 文件 | 取代者 |
|---|---|
| `2026-05-15-resume-edit-flow-layering.md` | `2026-05-18-remove-draft-resume-state.md` |
| `2026-05-15-resume-editor-state-deepening.md` | `2026-05-18-remove-draft-resume-state.md` |
| `2026-05-19-remove-blockid-from-resume-domain.md` | `2026-05-18-remove-draft-resume-state.md` |
| `resume-canvas-section-entry.md` | `blank-resume-defaults.md` + `2026-05-20-resume-section-manual-reorder.md` |
| `resume-template-foundation.md` | `2026-05-20-resume-section-manual-reorder.md` |
| `resume-template-foundation-phase-1.md` | `resume-template-foundation.md` |

### 已完整落地
| 文件 | 内容 |
|---|---|
| `2026-05-18-remove-draft-resume-state.md` | 核心重构：draft → persisted-only 模型 |
| `2026-05-20-resume-entry-drag-reorder.md` | entry 拖拽排序 |
| `2026-05-20-resume-section-manual-reorder.md` | section 上/下移排序 + sectionOrder 语义收敛 |
| `2026-05-21-uploaded-resume-intake-deepening.md` | 上传 PDF → Application Resume intake orchestration、SSE 协议与 rollback 语义 |
| `2026-05-23-ai-sdk-phase-1-resume-revision-foundation.md` | Resume revision / snapshot 基础链路、authoritative save/rollback 返回值 |
| `2026-05-23-ai-sdk-phase-2-chat-server-authority-cutover.md` | Chat server-authority cutover：服务端 tool 执行 + data-resume-patch 下发 + 前端纯消费者切换 |
| `2026-05-23-ai-sdk-phase-3-chat-contract-boundary-cleanup.md` | Chat contract boundary cleanup：schema 收口 + 模块迁移 + 旧边界清理 |
| `blank-resume-defaults.md` | 空白简历起步流程 |
| `resume-chat.md` | chat 能力最终落地结果 |
| `resume-editor-tools.md` | editor tools 最终落地结果 |
| `test-patterns.md` | 测试模式约定 |
