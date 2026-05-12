/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createStore } from "jotai"
import { focusSectionAtom, selectedSectionIdAtom } from "@/lib/store/resume"

describe("focusSectionAtom", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
    vi.useFakeTimers()
  })

  it("should keep the left resume canvas still while scrolling the form", () => {
    const store = createStore()
    const sectionElement = document.createElement("div")
    const formElement = document.createElement("div")
    const sectionScrollIntoView = vi.fn()
    const formScrollIntoView = vi.fn()

    sectionElement.id = "section-employment-1"
    formElement.id = "form-employment-1"
    sectionElement.scrollIntoView = sectionScrollIntoView
    formElement.scrollIntoView = formScrollIntoView

    document.body.append(sectionElement, formElement)

    store.set(focusSectionAtom, "employment", 1)
    vi.runAllTimers()

    expect(store.get(selectedSectionIdAtom)).toBe("employment")
    expect(sectionScrollIntoView).not.toHaveBeenCalled()
    expect(formScrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start"
    })
  })
})
