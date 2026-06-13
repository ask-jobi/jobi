# Landing Page 文案

> 本文档记录当前已落地的首页结构与文案承载点，便于后续同步翻译与页面实现。
> 当前首页文案主要来自 `lib/i18n/translations/*.{json}` 的 `landingPage` 节点。

## 当前已实现结构

首页当前只有 4 个主要区块：

1. Hero
2. Problem
3. Features
4. CTA

> 说明：旧版草稿里提到的 Value Prop Block 和“按钮下方注释”目前并未在 `app/page.tsx` 中落地，不应再作为当前实现文档的一部分。

---

## Hero Section（首屏）

对应 key：

- `landingPage.hero.slogan`
- `landingPage.hero.valueProposition`
- `landingPage.getStarted`
- `landingPage.hero.learnMore`

当前行为：

- 主 CTA：未登录跳 `/auth/sign-up`，已登录跳 `/dashboard`
- 次 CTA：锚点跳到 `#features`

---

## Problem Section（问题区）

对应 key：

- `landingPage.problem.title`
- `landingPage.problem.subtitle`
- `landingPage.problem.problem1`
- `landingPage.problem.problem1Desc`
- `landingPage.problem.problem2`
- `landingPage.problem.problem2Desc`
- `landingPage.problem.problem3`
- `landingPage.problem.problem3Desc`
- `landingPage.problem.atsExplanation`

实现说明：

- 当前是 3 张 problem card
- 第 3 张卡片里的 `ATS` 带 tooltip 解释
- 卡片在滚动进入视口时有轻量位移动画

---

## Features Section（功能展示区）

对应 key：

- `landingPage.features.title`
- `landingPage.features.description`
- `landingPage.features.feature1`
- `landingPage.features.feature1Desc`
- `landingPage.features.feature2`
- `landingPage.features.feature2Desc`
- `landingPage.features.feature3`
- `landingPage.features.feature3Desc`

当前配图：

- `/public/landing-page/一键导入.png`
- `/public/landing-page/岗位定制.png`
- `/public/landing-page/真实表达.png`

实现说明：

- 当前是 3 个 feature block
- 左右图文交替布局
- 图片本身就是页面叙事的一部分，更新文案时通常也要一起检查截图是否仍匹配

---

## CTA Section（结尾行动区）

对应 key：

- `landingPage.readyToStart`
- `landingPage.ctaDescription`
- `landingPage.getStarted`

当前行为：

- CTA 跳转逻辑与 Hero 主按钮一致

---

## 更新方式

- 优先修改 `lib/i18n/translations/zh.json` 和 `lib/i18n/translations/en.json`
- 如果文案调整会改变首页结构，再同步更新 `app/page.tsx`
- 如果替换功能截图，同时更新 `public/landing-page/` 下资源
