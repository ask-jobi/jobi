// Umami Analytics 类型定义
interface Umami {
  track: (
    eventName: string,
    eventData?: Record<string, string | number>
  ) => void
  identify: (userId: string, userData?: Record<string, string | number>) => void
}

declare global {
  interface Window {
    umami?: Umami
  }
}

export {}
