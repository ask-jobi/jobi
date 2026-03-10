---
name: code-architecture-review
description: 对指定模块或项目代码进行架构与代码质量审查，识别潜在结构问题、循环依赖、重复逻辑、未使用代码以及可重构点，并给出清晰的优化建议。
---

# code-architecture-review

通用代码架构与质量审查工具，用于系统性分析目标模块的代码质量并提供优化建议。适用于任何编程语言和框架的项目。

## 如何使用

当用户请求代码审查、架构分析或代码质量评估时，使用此 skill。

### Step 1: 确定审查范围

从用户请求中提取关键信息：
- **目标模块**: 如 `src/components/`、`server/api/`、`lib/utils/`
- **项目类型**: 前端/后端/全栈
- **审查重点**: 结构、依赖、重复代码、可维护性等

### Step 2: 收集相关文件

根据项目技术栈，使用合适的工具收集目标模块的相关文件：

```bash
# 使用 glob 查找文件（支持各种文件类型）
glob "target_scope/**/*.{ts,tsx,js,jsx,py,go,rs,java}"
glob "target_scope/**/*.vue"
glob "target_scope/**/*.svelte"

# 使用 grep 搜索特定代码模式
grep "pattern" --include="*.ts"
grep "import.*from" --include="*.tsx"
```

### Step 3: 执行架构分析

按以下 7 个维度进行分析，每个维度都独立评估：

1. **项目结构** - 目录与文件组织
2. **API 与数据流** - 调用链路与数据传递
3. **依赖关系** - 模块间耦合与引用
4. **未使用代码** - 死代码与冗余
5. **重复逻辑** - 可复用的抽象
6. **可重构点** - 过长/过复杂代码
7. **可维护性** - 扩展性与技术债

### Step 4: 输出分析报告

按以下格式输出每个问题：

```
## Issue Type
问题类型

### Location
文件或模块路径

### Problem
当前问题描述

### Impact
可能带来的问题

### Suggested Improvement
具体的重构或优化建议
```

---

## 分析维度详解

### 1. 项目结构（Project Structure）

**检查项**:
- 目录结构是否清晰、层次分明
- 命名是否符合项目规范（大小写、复数形式等）
- 文件/模块是否遵循单一职责原则
- 是否有职责过于宽泛的模块
- 公共代码与业务代码是否分离

**工具**: glob、read
- glob: 快速了解目录结构
- read: 查看关键文件的组织方式

### 2. API 与数据流（API & Data Flow）

**检查项**:
- API 端点设计是否合理（RESTful 或符合框架规范）
- 是否存在重复请求或不必要的轮询
- 数据流是否单向、清晰
- 前后端职责是否分离
- 错误处理是否一致

**工具**: grep、read
- grep: 搜索 API 调用模式
- read: 追踪数据流路径

### 3. 依赖关系（Dependency Analysis）

**检查项**:
- 是否存在循环依赖（A→B→A）
- 跨层引用是否合理（如 UI 层直接访问数据层）
- 模块间是否过度耦合
- 导入路径是否规范（避免相对路径滥用）
- 依赖是否合理（避免不必要的外部依赖）

**工具**: grep、read
- grep: 搜索 import/require/export 语句
- read: 分析依赖图的合理性

### 4. 未使用代码（Dead Code）

**检查项**:
- 导出但未使用的函数/组件/类
- 定义但未使用的变量/常量
- 注释掉的代码（遗留代码）
- 未使用的配置文件
- 过度注释的代码（可能是废弃的替代实现）

**工具**: grep、type_check
- grep: 搜索函数/变量名是否被引用
- type_check: 检测未使用的导入和类型

### 5. 重复逻辑（Duplicate Logic）

**检查项**:
- 相似或相同的函数/方法
- 重复的验证/校验逻辑
- 多处相同的数据转换/格式化
- 可抽取为公共工具的重复代码
- 可复用的业务逻辑

**工具**: grep、read
- grep: 搜索相似代码模式
- read: 对比相似实现

### 6. 可重构点（Refactoring Opportunities）

**检查项**:
- 过长函数（建议不超过 50-100 行）
- 过长组件（props 过多或渲染逻辑复杂）
- 深层嵌套的条件/循环
- 魔法数字/字符串
- 可抽取为独立模块的逻辑

**工具**: read、lookup_type
- read: 分析函数/组件复杂度
- lookup_type: 查看类型定义的复杂度

### 7. 可维护性与扩展性（Maintainability）

**检查项**:
- 是否遵循项目代码规范
- 类型定义是否完整（强类型优先于 any）
- 错误处理是否完善
- 文档注释是否充分
- 新功能添加是否需要大量修改现有代码

**工具**: read、type_check
- read: 检查代码可读性
- type_check: 验证类型安全性

---

## 通用输出模板

### 架构问题

```markdown
## Issue Type: Project Structure

### Location
`src/modules/feature-x/`

### Problem
模块职责不清晰，同时处理数据获取、UI 渲染和业务逻辑

### Impact
- 代码难以测试
- 难以复用
- 维护成本高

### Suggested Improvement
按职责拆分:
- `components/` - UI 表现层
- `services/` 或 `actions/` - 业务逻辑层
- `hooks/` - 可复用的状态/逻辑
```

### 循环依赖

```markdown
## Issue Type: Dependency Analysis

### Location
`module-a/index.ts` → `module-b/index.ts` → `module-a/index.ts`

### Problem
A 模块和 B 模块存在循环依赖

### Impact
- 打包困难
- 难以单独测试
- 增加耦合度

### Suggested Improvement
通过抽离共享模块或使用依赖注入解耦
```

### 死代码

```markdown
## Issue Type: Dead Code

### Location
`utils/legacy.ts:45-60`

### Problem
未使用的工具函数 `formatLegacyDate`

### Impact
- 增加打包体积
- 混淆代码库
- 维护负担

### Suggested Improvement
删除该函数及其所有引用，或确认是否为预留功能
```

### 重复逻辑

```markdown
## Issue Type: Duplicate Logic

### Location
- `utils/formatDate.ts`
- `helpers/dateFormatter.ts`

### Problem
多处实现相同的日期格式化逻辑

### Impact
- 代码冗余
- 修改时需要同步多处
- 不一致风险

### Suggested Improvement
抽离为公共函数，统一使用位置
```

### 可重构模块

```markdown
## Issue Type: Refactoring Opportunity

### Location
`components/Forms/UserForm.tsx`

### Problem
组件包含 45 个 props，超过 300 行代码

### Impact
- 难以理解
- props 命名冲突风险
- 测试困难

### Suggested Improvement
1. 拆分为子组件
2. 使用状态管理共享状态
3. 抽取验证逻辑到独立模块
```

### 结构优化

```markdown
## Issue Type: Architecture Optimization

### Location
`api/users/`

### Problem
API 路由直接包含业务逻辑，违反分层架构

### Impact
- 业务逻辑难以复用
- 测试困难
- 难以扩展

### Suggested Improvement
1. 将业务逻辑抽离到 services/ 或 actions/
2. API 层只做参数校验和请求转发
3. 考虑使用中间件模式
```

---

## 快速检查清单

根据项目实际情况选择检查项：

### 结构层面
- [ ] 目录结构清晰，职责分明
- [ ] 命名规范统一
- [ ] 公共代码与业务代码分离
- [ ] 无循环依赖

### 代码层面
- [ ] 无未使用的导入/函数
- [ ] 无重复逻辑
- [ ] 函数/组件长度合理
- [ ] 类型定义完整，无 `any`

### 架构层面
- [ ] API 逻辑与业务逻辑分离
- [ ] 层次清晰，无过度耦合
- [ ] 错误处理完善
- [ ] 遵循项目代码风格

---

## 工具调用建议

| 工具 | 用途 | 使用场景 |
|------|------|----------|
| glob | 查找文件 | 快速了解目录结构，定位相关文件 |
| grep | 搜索代码 | 查找模式、分析依赖、发现重复 |
| read | 阅读代码 | 分析逻辑复杂度、追踪数据流 |
| type_check | 类型检查 | 发现类型问题、未使用代码 |
| lookup_type | 类型查找 | 理解类型定义、接口设计 |
| list_types | 类型列表 | 了解项目类型系统 |

### 工具组合使用示例

```bash
# 1. 了解目录结构
glob "target/**/*.ts"

# 2. 查找特定模式（如 API 调用）
grep "async function" --include="*.ts"

# 3. 分析依赖
grep "import.*from" --include="*.ts"

# 4. 检查未使用
type_check
```
