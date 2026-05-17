export const QUOTA = {
  FREE: {
    quota_chat_tokens: 50_000
  },
  LITE: {
    quota_chat_tokens: 500_000
  },
  PRO: {
    quota_chat_tokens: 1_000_000
  }
} as const
