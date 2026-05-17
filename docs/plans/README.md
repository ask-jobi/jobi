# Plans 文档说明

`docs/plans/` 是项目统一的计划目录。

## 目录结构

- `docs/plans/current/` - 当前正在执行的 plan
- `docs/plans/archive/` - 已完成的 plan

## 使用方式

- 新增能力、破坏性变更或架构调整时，先在 `docs/plans/current/` 中编写或更新对应 plan
- Agent 在执行 `docs/plans/current/` 中的 plan 时，应先判断是否存在可并行拆分的子任务；适合拆分时，优先把代码探索、实现、UI 回归分别交给合适的 agent
- 对于 bug 修复类计划，至少应显式检查以下三件事：问题定位是否可交给 `explorer` 并行分析、实现是否可交给 `worker` 拆分、改动若触及 UI 主流程是否需要补 `playwright_tester` 回归
- plan 完成后，将其移动到 `docs/plans/archive/`
- 当前实施中的内容以 `docs/plans/current/` 为准
