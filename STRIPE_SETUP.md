# Stripe 集成配置指南

## 概述

本项目已集成 Stripe Checkout 支付功能，当前用于一次性购买 Token 包。以下是配置步骤：

## 1. 环境变量配置

在您的 `.env.local` 文件中添加以下环境变量：

```bash
# Stripe 密钥
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe 一次性价格 ID
STRIPE_LITE_PASS_PRICE_ID=price_...
STRIPE_PRO_PASS_PRICE_ID=price_...
```

## 2. Stripe 产品配置

### 在 Stripe Dashboard 中创建产品：

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 开启 test mode
3. 进入 "产品" 页面
4. 创建两个一次性价格：
   - Lite Token Pack：€19.99，500,000 Tokens
   - Pro Token Pack：€24.99，1,000,000 Tokens

### 获取价格 ID

创建价格后，复制价格 ID（格式如：`price_1RfneaQAnDbV3CHRBJiDcgBW`）并更新 `STRIPE_LITE_PASS_PRICE_ID` 和 `STRIPE_PRO_PASS_PRICE_ID`。

## 3. Webhook 配置（推荐）

为了处理支付成功、取消等事件，建议配置 Webhook：

1. 在 Stripe Dashboard 中进入 "Webhooks"
2. 添加端点：`https://yourdomain.com/api/stripe/webhook`
3. 至少选择以下事件：
   - `checkout.session.completed`
4. 复制 signing secret（`whsec_...`）并更新 `STRIPE_WEBHOOK_SECRET`
### 本地测试 webhook 回调事件
命令行输入: 
`stripe listen --forward-to localhost:3000/api/stripe/webhook`

该命令会输出本地临时 webhook signing secret（`whsec_...`），本地测试时需要把它写入 `.env.local` 的 `STRIPE_WEBHOOK_SECRET`。

## 4. 测试支付

### 测试卡号 各种场景
https://docs.stripe.com/testing


### 测试流程
1. 访问定价页面
2. 点击 "选择专业版" 按钮
3. 如果未登录，会弹出登录提示模态框
4. 登录后再次点击购买按钮
5. 使用测试卡号完成支付
6. 验证重定向到成功页面

### 支付取消测试
1. 访问 `/test-cancel` 页面
2. 点击 "模拟支付取消" 按钮
3. 验证橙色提示框显示和自动消失
4. 在Stripe支付页面点击取消，应该重定向到定价页面并显示取消提示

### 登录检查功能
- 未登录用户点击付费套餐会显示友好的登录提示
- 已登录用户可以直接进行支付
- 免费套餐无需登录即可访问
- 中间件自动处理会话更新和认证状态
- API接口进行双重认证检查确保安全性

### 支付取消处理
- 支付取消后重定向到定价页面并显示提示
- 提示框5秒后自动消失
- 支持手动关闭提示框
- 自动清理URL参数

## 5. 文件结构

```
├── app/
│   ├── api/
│   │   └── checkout_sessions/
│   │       └── route.ts          # Stripe 结账会话 API
│   │   └── stripe/webhook
│   │       └── route.ts          # 支付成功后的回填创建 access passes 等处理
│   ├── pricing/
│   │   └── page.tsx              # 定价页面
│   ├── success/
│   │   └── page.tsx              # 支付成功页面
├── components/
│   └── client-components/
│       ├── pricing-card.tsx      # 定价卡片组件
│       ├── payment-error.tsx     # 支付错误组件
│       ├── login-required-modal.tsx  # 登录提示模态框
│       └── payment-cancelled-alert.tsx  # 支付取消提示
├── lib/
│   ├── payment/
│   │   ├── stripe.ts             # Stripe 客户端配置
│   │   └── stripe-config.ts      # 价格配置

```

## 6. 自定义配置

### 修改价格配置

编辑 `lib/payment/stripe-config.ts` 文件来修改价格和功能：

```typescript
export const PRICING_CONFIG = {
  PRO: {
    title: '专业版',
    price: '¥99',
    description: '每月，适合求职者',
    features: [
      '每月 50 次简历优化',
      '高级 AI 分析',
      // ... 更多功能
    ],
    priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
    mode: 'payment', //标识为一次性付款
    plan: 'PRO',
    isPopular: true,
    buttonText: '选择专业版',
    buttonVariant: 'default'
  },
  // ... 其他套餐
}
```

### 添加新的支付模式

如果需要支持一次性支付，可以修改 `mode` 参数：

```typescript
{
  priceId: 'price_one_time',
  mode: 'payment',  // 一次性支付 subscription 订阅
}
```

## 7. 错误处理

系统已集成错误处理机制：
- 支付失败时显示错误提示
- 自动重试机制
- 用户友好的错误信息

## 8. 安全注意事项

- 永远不要在前端暴露 `STRIPE_SECRET_KEY`
- 使用环境变量管理敏感信息
- 在生产环境中启用 HTTPS
- 验证 Webhook 签名
- 中间件已处理会话更新和认证状态管理
- API接口进行双重认证检查（前端+后端）

## 9. 生产环境部署

1. 将测试密钥替换为生产密钥
2. 更新 Webhook 端点为生产域名
3. 测试所有支付流程
4. 监控支付日志和错误

## 支持

如有问题，请查看：
- [Stripe 官方文档](https://stripe.com/docs)
- [Next.js 的最新 DEMO](https://github.com/nextjs/saas-starter/blob/main/lib/payments/stripe.ts)
