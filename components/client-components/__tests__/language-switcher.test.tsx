/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"

jest.mock("@/lib/i18n/services")
jest.mock("next-intl")

import { LanguageSwitcher } from "../language-switcher"

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render with current locale as English", () => {
    require("next-intl").useLocale = () => "en"

    render(<LanguageSwitcher />)

    expect(screen.getByRole("button")).toBeInTheDocument()
    expect(screen.getByRole("button")).toHaveTextContent("中文")
  })

  it("should render with current locale as Chinese", () => {
    require("next-intl").useLocale = () => "zh"

    render(<LanguageSwitcher />)

    expect(screen.getByRole("button")).toBeInTheDocument()
    expect(screen.getByRole("button")).toHaveTextContent("EN")
  })

  it("should call setUserLocale when toggled from zh to en", () => {
    const mockSetUserLocale = require("@/lib/i18n/services")
      .setUserLocale as jest.Mock
    require("next-intl").useLocale = () => "zh"

    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole("button"))

    expect(mockSetUserLocale).toHaveBeenCalledWith("en")
  })

  it("should call setUserLocale when toggled from en to zh", () => {
    const mockSetUserLocale = require("@/lib/i18n/services")
      .setUserLocale as jest.Mock
    require("next-intl").useLocale = () => "en"

    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole("button"))

    expect(mockSetUserLocale).toHaveBeenCalledWith("zh")
  })

  it("should render button with correct classes", () => {
    require("next-intl").useLocale = () => "en"

    render(<LanguageSwitcher />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("flex")
    expect(button).toHaveClass("items-center")
  })

  it("should contain globe icon", () => {
    require("next-intl").useLocale = () => "en"

    render(<LanguageSwitcher />)

    const button = screen.getByRole("button")
    expect(button.querySelector("svg")).toBeInTheDocument()
  })
})
