export const QUOTA = {
  FREE: {
    quota_full_optimize: 1_000_000,
    quota_block_optimize: 1_000_000,
    quota_motivation_letter: 1_000_000,
    quota_chat_tokens: 50_000
  },
  LITE: {
    quota_full_optimize: 1_000_000,
    quota_block_optimize: 1_000_000,
    quota_motivation_letter: 1_000_000,
    quota_chat_tokens: 500_000
  },
  PRO: {
    quota_full_optimize: 1_000_000,
    quota_block_optimize: 1_000_000,
    quota_motivation_letter: 1_000_000,
    quota_chat_tokens: 1_000_000
  }
} as const
