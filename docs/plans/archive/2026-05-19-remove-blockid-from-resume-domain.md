# Remove `blockId` from Resume Domain Model

> ⚠️ **已过期（superseded）** — `blockId` → `entryId` 的迁移已随 `2026-05-18-remove-draft-resume-state.md` 一并完成，当前代码不再使用 `blockId`。本文件的迁移步骤已不再需要执行，仅保留作为领域命名的历史记录。

## 背景

简历编辑器的领域语言已经在根目录 [CONTEXT.md](../../../CONTEXT.md) 中明确：

- repeatable section 的内容单位叫 `Entry`
- `block` 不再是领域词
- `personalInfo` 是一个非 repeatable 的 `Section`

但当前代码和历史数据里仍残留两类旧结构：

1. repeatable section 仍可能保留旧的 `blocks[*].blockId`
2. `personalInfo` 仍使用 `blockId`

这带来两个问题：

- 命名与领域模型不一致，后续实现容易继续混用 `block` / `entry`
- 新逻辑若假设每条 entry 都有 `entryId`，历史数据会出现兼容问题

本计划用于把这类残留收口成一套明确、可迁移、可回滚的方案。

## 目标

- 彻底移除 repeatable section 中的 `blockId` / `blocks` 结构
- 明确 repeatable section 统一使用 `entries[*].entryId`
- 将 `personalInfo.blockId` 收口为 `personalInfo.entryId`
- 收口并记录已执行的历史 `resume_json` SQL migration
- 在迁移完成后移除前端/服务端对旧字段的长期依赖

## 非目标

- 本轮不重构 evaluation report
- 本轮不重构 chat session 模型
- 本轮不修改 resume section 的产品能力边界
- 本轮不顺带处理与 resume domain 无关的全局命名问题

## 当前状态

- 历史数据 SQL 已执行
- 本计划后续重点转为：代码侧统一写入新结构、删除兼容层、补齐回归验证

## 已确认决策

### 1. repeatable section 只保留 `entryId`

适用 section：

- `education`
- `employment`
- `skills`
- `projects`
- `research`
- `publications`
- `awards`
- `certifications`

目标结构：

- `blocks` -> `entries`
- `blockId` -> `entryId`

### 2. 历史数据迁移时复用旧 `blockId` 的值

对于历史 repeatable entries：

- 若已有 `blockId`，直接把该值复制到 `entryId`
- 不重新生成 id
- 这样可以保留既有 identity，避免同一条经历在迁移前后变成不同对象

### 3. `personalInfo` 也统一改成 `entryId`

虽然 `personalInfo` 不是 repeatable entry，但本轮决定把 identity 字段统一收口为 `entryId`，以减少实现层分叉。

目标结构：

- `personalInfo.blockId` -> `personalInfo.entryId`

### 4. 迁移分两层进行

- **代码兼容层**：短期允许读取旧字段，避免迁移窗口内页面直接失败
- **数据迁移层**：通过 SQL 一次性修复历史 `resume_json`

最终目标是迁移完成后删除兼容分支，而不是永久保留双写/双读。

### 5. 新写入路径必须直接产出最终结构

迁移完成后，所有新数据都应直接写入：

- `entries[*].entryId`
- `personalInfo.entryId`

禁止继续生成：

- `blocks`
- `blockId`
- `personalInfo.blockId`

## 目标数据结构

### Repeatable section

```json
{
  "education": {
    "entries": [
      {
        "entryId": "existing-or-generated-id",
        "school": "...",
        "degree": "..."
      }
    ]
  }
}
```

### Personal info section

```json
{
  "personalInfo": {
    "entryId": "stable-id",
    "firstName": "...",
    "lastName": "..."
  }
}
```

## 执行策略

## Phase 1: 先锁定最终命名与兼容边界

### Slice 1.1 类型与文档收口

- 更新 `types/resume.ts`
- 明确 `PersonalInfo.entryId`
- 确认代码中不再把 repeatable item 叫作 `block`
- 在相关 plan / context 中记录最终 canonical shape

验收：

- 新类型定义里，repeatable item 只有 `entryId`
- `personalInfo` 只有 `entryId`

### Slice 1.2 明确临时兼容策略

短期兼容规则：

- repeatable item 读取时可兼容旧 `blockId`
- `personalInfo` 读取时可兼容旧 `blockId`
- 所有保存路径统一写入新结构

验收：

- 迁移前老数据不会导致编辑页报错
- 新保存后的数据自动收敛到新结构

## Phase 2: 代码先支持最终结构

### Slice 2.1 repeatable section 统一写 `entryId`

涉及：

- `server/ai/resume-parser.ts`
- `lib/templates/section-factories.ts`
- `lib/agent/tools.ts`
- `lib/resume/mutations.ts`
- 任何创建新 entry 的表单或 AI 路径

要求：

- 新建 entry 只生成 `entryId`
- 若旧兼容分支读到 `blockId`，保存后必须写回为 `entryId`

### Slice 2.2 `personalInfo.blockId` -> `personalInfo.entryId`

涉及：

- `types/resume.ts`
- parser/schema
- store/selectors
- resume editor
- tests/mocks/fixtures

要求：

- 新代码统一使用 `personalInfo.entryId`
- 临时兼容层允许读取旧 `blockId`

### Slice 2.3 缩小 compatibility seam

- 兼容逻辑集中到少数 parser / normalizer / hydration helper
- UI 组件不直接散落处理 `blockId || entryId`

建议新增：

- `normalizeResumeData(...)`
- 或等价的 server/client hydration helper

验收：

- 业务组件只消费规范化后的新结构
- 旧结构兼容集中在单一入口

## Phase 3: 历史数据 migration

### Slice 3.1 repeatable section SQL migration

规则：

- `blocks` 改为 `entries`
- `blockId` 复制到 `entryId`
- 若两者都无值，再生成 uuid
- 删除 entry 上旧 `blockId`

### Slice 3.2 `personalInfo` SQL migration

规则：

- `personalInfo.blockId` -> `personalInfo.entryId`
- 若两者都无值，再生成 uuid
- 删除旧 `personalInfo.blockId`

状态：

- 已执行

### Slice 3.3 验证 SQL

至少提供两类校验：

- 仍残留 `blocks` / `blockId` 的记录数
- 缺失 `entries[*].entryId` / `personalInfo.entryId` 的记录数

验收：

- SQL 跑完后，上述检查结果为 0

## Phase 4: 删除兼容层

前提：

- 生产历史数据 migration 已完成
- 抽样确认编辑、AI、导出、评估链路正常

可删除内容：

- 读取旧 `blocks`
- 读取旧 `blockId`
- `personalInfo.blockId` fallback
- 针对旧结构的临时测试 fixture

验收：

- 代码中不再出现 resume domain 下的 `blockId`
- repeatable section 不再出现 `blocks`
- `personalInfo` 不再出现 `blockId`

## 影响范围

### 高影响代码

- `types/resume.ts`
- `server/ai/resume-parser.ts`
- `lib/agent/tools.ts`
- `lib/templates/section-factories.ts`
- `lib/resume/mutations.ts`
- `lib/store/resume.ts`
- `lib/store/resume-editor-state.ts`
- `components/resumes/*`
- `components/agent/chat/resume-editor.ts`
- `app/api/chat/truncate/route.ts`
- `app/api/resume/upload-and-analyze/route.ts`
- `app/api/resume/thumbnail/route.tsx`

### 测试与 fixtures

- `components/resumes/__tests__/*`
- `components/forms/__tests__/*`
- `server/ai/resume-parser.test.ts`
- `server/resume*.test.ts`
- `app/api/*resume*/*.test.ts`

## 风险

### 1. 历史数据形状可能不止一种

可能同时存在：

- `blocks[*].blockId`
- `entries[*].blockId`
- `entries[*]` 缺失 `entryId`
- `personalInfo.blockId`

因此 migration 必须面向“多种历史形状”而不是单一版本。

### 2. identity 变更会影响重排/删除/AI 修改

如果重复生成新 id，会影响：

- entry 定位
- reorder
- truncate
- AI tool output merge

因此 repeatable entry 的旧 `blockId` 必须优先复用。

### 3. `personalInfo` 改名会触及较多 mocks 与测试

虽然它不是复杂结构，但改名面广，适合单独做 slice，而不应夹在其他业务改动里一起完成。

## 建议测试矩阵

至少覆盖：

1. 老数据：`blocks[*].blockId`
2. 老数据：`entries[*].blockId`
3. 老数据：`entries[*]` 无 `entryId`
4. 老数据：`personalInfo.blockId`
5. 新数据：`entries[*].entryId + personalInfo.entryId`

关键链路：

- 打开编辑弹窗
- 保存已有 entry
- 新增 entry
- 删除 entry
- AI rewrite / truncate
- 生成 thumbnail
- 导出 / evaluation 基础读取

## SQL 交付要求

本轮历史 SQL 已执行；后续实施 PR 中至少补齐：

- post-check 查询结果
- 迁移后抽样验证说明
- 是否仍需保留临时兼容层的判断

## 验收标准

- repeatable section 历史数据全部迁移为 `entries[*].entryId`
- `personalInfo` 全部迁移为 `entryId`
- 新代码不再写入 `blocks` / `blockId`
- 兼容层在 migration 完成后可被删除
- `CONTEXT.md` 中的 `Entry` 术语与代码实现重新对齐

## 预期结果

完成后，resume domain 会真正收口为：

- repeatable section 使用 `Entry`
- repeatable item identity 使用 `entryId`
- personal info identity 也统一使用 `entryId`
- `block` 从领域与持久化层彻底退出，只允许作为历史迁移语境存在
