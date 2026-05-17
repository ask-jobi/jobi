---
description: 根据当前 git staged changes 生成 commit message 并提交
agent: build
---
!`git add .`
执行以下命令获取测试覆盖率报告
`vitest run --coverage`

要求：
1. commit message 必须严格遵循以下格式：
   [AIRS-$1] {action}: {message}

2. 其中：
    - action 必须从以下列表中选择最合适的一个：
        - feat: 新功能、新需求
        - fix: 修复某个问题
        - doc: 文档（如 README / md 文件）改动
        - build: CI/CD、pipeline、构建脚本变动
        - chore: 杂项、非功能性修改（格式化、配置、依赖等）
        - refactor: 不改变功能的代码重构
        - test: 测试相关改动
        - perf: 性能优化

3. 自动生成的 message 的要求：
    - 使用英文
    - 简洁、明确，不超过 30 个单词
    - 描述「做了什么」，而不是「为什么」

4. 不要输出多行 message
5. 不要包含 emoji、句号或多余说明
6. 最终只输出一行 commit message
7. 不需要查看过去的git提交记录
8. 确保测试覆盖率报告达标后才能提交

工作流程：
- 分析测试覆盖率报告，在达标后进行以下流程
- 分析代码变更的主要意图，并生成message
- 如果无法判断 action，选择最保守的一个（feat）
- 将message通过git commit提交
