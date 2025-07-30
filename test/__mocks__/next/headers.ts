// __mocks__/next/headers.ts
import { mockDeep } from 'jest-mock-extended';

const mockCookieStorage = new Map<string, { name: string; value: string; options?: any }>();

export const cookies = jest.fn(() => {
  return mockDeep<any>({
    get: jest.fn((name: string) => {
      const cookie = mockCookieStorage.get(name);
      return cookie ? { name: cookie.name, value: cookie.value } : undefined;
    }),
    getAll: jest.fn(() => {
      return Array.from(mockCookieStorage.values());
    }),
    set: jest.fn((name: string, value: string, options: any) => {
      mockCookieStorage.set(name, { name, value, options });
    }),
    delete: jest.fn((name: string) => {
      mockCookieStorage.delete(name);
    }),
  });
});

export const headers = jest.fn(() => {
  return mockDeep<any>({
    get: jest.fn(),
    // ... 其他可能用到的方法
  });
});

export const clearAllMocks = () => {
  mockCookieStorage.clear(); // 清空模拟的 cookie 存储
  cookies.mockClear();     // 清除 cookies() mock 的调用记录
  headers.mockClear();     // 清除 headers() mock 的调用记录
};
