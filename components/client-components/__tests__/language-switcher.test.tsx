/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import * as nextIntl from "next-intl"
import * as i18nServices from "@/lib/i18n/services"

import { LanguageSwitcher } from "../language-switcher"

describe("LanguageSwitcher", () => {
  const mockUseLocale = vi.spyOn(nextIntl, "useLocale").mockReturnValue("en")
  const mockSetUserLocale = vi
    .spyOn(i18nServices, "setUserLocale")
    .mockImplementation(() => Promise.resolve())
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetUserLocale.mockImplementation(() => Promise.resolve())
  })

  it("should render with current locale as English", () => {
    mockUseLocale.mockReturnValue("en")

    render(<LanguageSwitcher />)

    expect(screen.getByRole("button")).toBeInTheDocument()
    expect(screen.getByRole("button")).toHaveTextContent("中文")
  })

  it("should render with current locale as Chinese", () => {
    mockUseLocale.mockReturnValue("zh")

    render(<LanguageSwitcher />)

    expect(screen.getByRole("button")).toBeInTheDocument()
    expect(screen.getByRole("button")).toHaveTextContent("EN")
  })

  it("should call setUserLocale when toggled from zh to en", () => {
    mockUseLocale.mockReturnValue("zh")

    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole("button"))

    expect(mockSetUserLocale).toHaveBeenCalledWith("en")
  })

  it("should call setUserLocale when toggled from en to zh", () => {
    mockUseLocale.mockReturnValue("en")

    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole("button"))

    expect(mockSetUserLocale).toHaveBeenCalledWith("zh")
  })

  it("should render button with correct classes", () => {
    mockUseLocale.mockReturnValue("en")

    render(<LanguageSwitcher />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("flex")
    expect(button).toHaveClass("items-center")
  })

  it("should contain globe icon", () => {
    mockUseLocale.mockReturnValue("en")

    render(<LanguageSwitcher />)

    const button = screen.getByRole("button")
    expect(button.querySelector("svg")).toBeInTheDocument()
  })
})
