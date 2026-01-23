import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
  NextIntlClientProvider: ({ children }: any) => children
}))

vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})
vi.spyOn(console, "warn").mockImplementation(() => {})
