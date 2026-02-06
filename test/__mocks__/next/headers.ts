// __mocks__/next/headers.ts
import { vi } from "vitest"

const mockCookieStorage = new Map<
  string,
  { name: string; value: string; options?: any }
>()

export const cookies = vi.fn(() => {
  return {
    get: vi.fn((name: string) => {
      const cookie = mockCookieStorage.get(name)
      return cookie ? { name: cookie.name, value: cookie.value } : undefined
    }),
    getAll: vi.fn(() => {
      return Array.from(mockCookieStorage.values())
    }),
    set: vi.fn((name: string, value: string, options: any) => {
      mockCookieStorage.set(name, { name, value, options })
    }),
    delete: vi.fn((name: string) => {
      mockCookieStorage.delete(name)
    })
  }
})

export const headers = vi.fn(() => {
  return {
    get: vi.fn()
  }
})

export const clearAllMocks = () => {
  mockCookieStorage.clear()
  cookies.mockClear()
  headers.mockClear()
}
