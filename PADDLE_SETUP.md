# Paddle 集成配置指南

## 概述

本项目使用 Paddle Billing Checkout 处理付费 Token 包购买。前端通过 Paddle.js 打开 Checkout，支付完成后由 `/api/paddle/webhook` 接收 `transaction.completed` 事件并发放 Token。

## 1. 环境变量

```bash
PADDLE_API_KEY=pdl_sdbx_...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_...
NEXT_PUBLIC_PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_LITE_PRICE_ID=pri_...
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=pri_...
PADDLE_LITE_PRICE_ID=pri_...
PADDLE_PRO_PRICE_ID=pri_...
```

`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` 和 `NEXT_PUBLIC_PADDLE_*_PRICE_ID` 会暴露到浏览器。client token 和 price ID 可以公开；不要把 `PADDLE_API_KEY` 或 `PADDLE_WEBHOOK_SECRET` 放到任何 `NEXT_PUBLIC_` 变量里。

## 2. 当前 Sandbox 产品和价格

- Lite Token Pack：`pri_01kv0qngf4mefz87sr4ts0neqp`，€19.99，500,000 Tokens
- Pro Token Pack：`pri_01kv0qsqh21dt05vtywzeqpnpx`，€24.99，1,000,000 Tokens

## 3. Paddle Dashboard 配置

1. 登录 Paddle sandbox。
2. 确认 products/prices 已存在。
3. 在 Developer tools > Notifications 创建 notification destination。
4. Webhook URL：

```text
https://yourdomain.com/api/paddle/webhook
```

5. 选择事件：

```text
transaction.completed
```

6. 复制 notification destination secret 到 `PADDLE_WEBHOOK_SECRET`。

## 4. 本地测试

1. 启动应用：

```bash
pnpm dev
```

2. 访问 `/pricing`。
3. 登录后点击 Lite 或 Pro。
4. Paddle Checkout 完成后会跳转到：

```text
/payment/success?transaction_id=txn_...
```

5. 成功页会轮询：

```text
/api/paddle/checkout-status?transaction_id=txn_...
```

## 5. 相关文件

- `lib/payment/paddle-config.ts`：Paddle price ID 配置
- `components/client-components/pricing-card.tsx`：打开 Paddle Checkout
- `app/api/paddle/webhook/route.ts`：处理 Paddle webhook 并发放 Token
- `app/api/paddle/checkout-status/route.ts`：成功页轮询支付处理状态
