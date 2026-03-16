## 1. Implementation
- [x] 1.1 扩展数据库 message 表，添加 token 细分字段 (input_tokens, output_tokens, cached_tokens, reasoning_tokens)
- [x] 1.2 移除 message 表的 cost 字段
- [x] 1.3 创建 token 计算工具函数，解析 AI SDK 返回的 usageMetadata
- [x] 1.4 修改 chat-history.ts 的 saveMessage 和 updateMessage 函数，支持 token 统计参数
- [x] 1.5 修改 app/api/chat/resume/route.ts，在消息完成后提取 token 使用量并保存
- [x] 1.6 扩展数据库 session 表，添加 token 细分字段 (total_input_tokens, total_output_tokens, total_cached_tokens, total_reasoning_tokens)
- [x] 1.7 移除 session 表的 total_cost 字段
- [x] 1.8 在 session 层面聚合 token 统计，更新所有 token 字段

## 2. API
- [x] 2.1 添加获取 session token 统计的 API 端点

## 3. Testing
- [x] 3.1 修复单元测试中的 mock 数据
- [x] 3.2 编写集成测试验证 token 存储和检索

## Deferred Follow-up
- 配额控制在后续 change 中实现
- 前端展示 token 消耗在后续 change 中实现
