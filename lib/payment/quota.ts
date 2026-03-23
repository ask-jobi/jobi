export const QUOTA = {
  FREE: {
    quota_full_optimize: 3,
    quota_block_optimize: 10,
    quota_motivation_letter: 3,
    quota_chat_tokens: 100_000
  },
  LITE: {
    quota_full_optimize: 20,
    quota_block_optimize: 100,
    quota_motivation_letter: 20,
    quota_chat_tokens: 1_000_000
  },
  PRO: {
    quota_full_optimize: 30,
    quota_block_optimize: 200,
    quota_motivation_letter: 30,
    quota_chat_tokens: 100_000_000
  }
} as const
