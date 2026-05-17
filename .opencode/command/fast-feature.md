---
description: 快速实现小需求/调整，使用 worktree 隔离开发，编写计划并执行
---
# Fast Feature Workflow

**用户需求：** $ARGUMENTS

## 第一步：创建 Worktree

I'm using the using-git-worktrees skill to set up an isolated workspace.

## 第二步：编写计划

I'm using the writing-plans skill to create the implementation plan.

## 第三步：执行计划

I'm using the executing-plans skill to implement this plan.

## 第四步：用户审批

完成实现后，请检查以下内容：
- 所有修改的文件
- 测试是否通过

请告诉我：
1. 是否满意当前的实现？
2. 是否需要修改？

## 第五步：合并分支

如果你满意实现结果，I'm using the finishing-a-development-branch skill to complete this work.

请选择合并方式：
1. 合并到本地分支
2. 推送并创建 Pull Request
3. 保留分支稍后处理
4. 丢弃此工作
