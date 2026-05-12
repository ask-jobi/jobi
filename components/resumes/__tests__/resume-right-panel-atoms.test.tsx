/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest"
import { createStore } from "jotai"
import {
  isRightPanelCollapsedAtom,
  openRightPanelAtom,
  rightPanelViewAtom,
  showRightPanelAtom
} from "@/lib/store/resume"

describe("right panel atoms", () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  it("should toggle collapse when reopening the same view from toolbar actions", () => {
    store.set(rightPanelViewAtom, "chat")
    store.set(isRightPanelCollapsedAtom, false)

    store.set(openRightPanelAtom, "chat")

    expect(store.get(rightPanelViewAtom)).toBe("chat")
    expect(store.get(isRightPanelCollapsedAtom)).toBe(true)
  })

  it("should keep the panel expanded when the left resume sections request the form view", () => {
    store.set(rightPanelViewAtom, "form")
    store.set(isRightPanelCollapsedAtom, false)

    store.set(showRightPanelAtom, "form")

    expect(store.get(rightPanelViewAtom)).toBe("form")
    expect(store.get(isRightPanelCollapsedAtom)).toBe(false)
  })
})
