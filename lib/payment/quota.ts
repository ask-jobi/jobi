export const QUOTA = {
  FREE: {
    quota_full_optimize: 3,
    quota_block_optimize: 10,
    quota_motivation_letter: 3,
  },
  LITE: {
    quota_full_optimize: 20,
    quota_block_optimize: 100,
    quota_motivation_letter: 20,
  },
  PRO: {
    quota_full_optimize: 30,
    quota_block_optimize: 200,
    quota_motivation_letter: 30,
  },
} as const