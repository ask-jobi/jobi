# Resume Canvas Section Entry

> ⚠️ **已过期（superseded）** — `blank-resume-defaults.md` 已落地了画布 Add Section 入口，`2026-05-20-resume-section-manual-reorder.md` 进一步统一了 section 生命周期。本文件的方案已被后续实现完全覆盖，不应作为参考。

## 背景

当前 section 管理已经具备底层 helper，但主要入口放在右侧 form 面板中。

这个方案的问题是：

- 默认进入简历页时，右侧常停留在 `evaluation` 视图
- 空白简历的左侧画布几乎没有可点击内容
- 用户很难自然发现"在哪里添加 section"

## 目标

- 把 section 添加入口移动到左侧简历画布
- 让空白简历在左侧直接呈现明确的起步动作
- 保持现有模板样式不被破坏

## 方案

### 空白简历

- 左侧保留完整 A4 空白页
- 画布中央显示一个大号 `+ Add Section` 按钮
- 点击后弹出可添加 section 列表

### 非空简历

- 左侧简历画布右上角显示一个轻量 `+ Add Section` 按钮
- 点击后弹出可添加 section 列表
- 已有 section 仍通过点击画布内容进入右侧 form 编辑

## 实施步骤

1. 新增画布级 section 入口组件
2. 接入 `addSection` helper 和保存逻辑
3. 从右侧面板移除主要 section 管理入口
4. 用 Playwright 回归空白简历和已有简历的添加路径

## 验收标准

- 空白简历左侧中央可直接看到添加入口
- 非空简历左侧可直接看到添加入口
- 点击入口后可选择并添加 optional section
- 添加后数据成功保存,页面无明显错位或报错
