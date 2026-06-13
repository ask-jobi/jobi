# 设计风格指南

本文档总结当前 Jobi 已落地的视觉语言，新增页面时优先沿用现有模式。

## 总体气质

- 关键词：`专业`、`克制`、`轻量`、`可信`
- 公开页可以更强调品牌感与转化
- 登录后工作台、编辑器、聊天区以效率和低干扰为先

## 两类页面的风格边界

### 1. 营销页（`/`、`/pricing`、`/payment/success`）

- 大留白、居中布局、分段式叙事
- Hero 与 CTA 常用紫蓝渐变按钮
- 截图、卡片、FAQ 区保持整洁，不堆过多装饰
- hover/滚动动效允许更明显，但仍保持轻量

### 2. 工作台页（`/dashboard`、`/application/*`、`/settings`）

- 以 sidebar + content 的工具型布局为主
- 常规信息容器使用浅边框、白底、轻阴影
- header 高度较薄，强调连续工作流，而不是营销式视觉冲击
- 重点通过排版、留白、边框建立层级

## 当前高频视觉母题

### Card

- Dashboard 简历卡片、Pricing Card、空状态卡片都沿用统一 card 体系
- `Create New Resume` 使用虚线边框卡片，hover 时轻微放大和提亮
- 卡片装饰要少，重点放在信息可扫读性和操作清晰度

### Resume Workspace

- 简历主体是居中的白色 A4 画布
- 画布外层是浅灰背景 + 细边框 + 轻阴影
- section hover 后出现轻量悬浮操作按钮（编辑 / 新增 / 删除）
- 右侧工作面板使用圆角边框容器，chat 与 evaluation 共享同一视觉骨架

### Navigation / Header

- 主应用使用 inset sidebar
- sidebar footer 中的 plan badge、settings、logout 保持系统化样式
- application header 采用返回按钮 + tab + 次级工具（导出、token usage）的组合

### Token / Plan Surface

- token 余额展示使用极简指标：badge、进度条、数字
- plan badge 用渐变区分 `FREE / LITE / PRO`
- 不使用复杂图表，保持信息一眼可读

## 色彩

- 基础色以 `background / card / muted / border / foreground` token 为主
- 主应用避免大面积高饱和背景
- 品牌强调主要出现在营销 CTA、热门套餐标识、少量 plan badge 上
- 成功态使用绿色，危险态使用 destructive 红色，警示态使用 amber

## 字体与文案观感

- 全局字体沿用 `Geist Sans` / `Geist Mono`
- 标题多为 `font-semibold` 或 `font-bold`
- 说明文字大量使用 `text-muted-foreground`
- 文案语气直接、工具化，避免过度营销或俏皮化

## 动效

- 常见动效：淡入、轻微位移、阴影增强、进度反馈
- 首页滚动显现和 CTA 光效可以保留
- 工作台里的动效应短、轻、可预测，避免持续吸引注意力

## 新设计开发时的 Do

- 先判断页面属于“营销页”还是“工作台页”
- 优先复用现有 `ui` 组件和 card/form/sidebar 模式
- 用留白和排版解决层级，不靠额外装饰堆砌
- 在 resume 编辑器中优先保护阅读、编辑、对比三个核心动作

## 新设计开发时的 Don't

- 不要在工作台页面直接复刻首页那种强品牌渐变大块视觉
- 不要引入新的重玻璃拟态、重霓虹、重插画背景
- 不要为了“设计感”牺牲表单清晰度、点击命中区和可扫描性
- 不要在相邻页面切换完全不同的配色与间距体系

## 一句话原则

Jobi 的 UI 应该始终像一个可信的求职工具：公开页适度强化品牌与转化，工作台稳定、克制、连续可用。
