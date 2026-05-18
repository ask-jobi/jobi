import { act, fireEvent, render, screen } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"
import { chatThreadLifecycleAtom } from "@/lib/store/chat"

describe("ResumeSectionActionButtonGroup", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        disconnect() {}
        observe() {}
        unobserve() {}
      }
    )
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("keeps the edit action visible briefly after pointer leave", () => {
    render(
      <ResumeSectionActionButtonGroup isInteractive onEdit={() => undefined}>
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const button = screen.getByRole("button", { name: "editSection" })
    const actions = button.parentElement
    const surface = screen.getByText("Section body").parentElement

    expect(actions).not.toBeNull()
    expect(surface).not.toBeNull()
    expect(actions).toHaveClass("opacity-0")

    fireEvent.mouseEnter(surface!)

    expect(actions).toHaveClass("opacity-100")

    fireEvent.mouseLeave(surface!)
    act(() => {
      vi.advanceTimersByTime(49)
    })

    expect(actions).toHaveClass("opacity-100")

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(actions).toHaveClass("opacity-0")
  })

  it("cancels the pending hide when the pointer re-enters quickly", () => {
    render(
      <ResumeSectionActionButtonGroup isInteractive onEdit={() => undefined}>
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const button = screen.getByRole("button", { name: "editSection" })
    const actions = button.parentElement
    const surface = screen.getByText("Section body").parentElement

    expect(actions).not.toBeNull()
    expect(surface).not.toBeNull()

    fireEvent.mouseEnter(surface!)
    fireEvent.mouseLeave(surface!)
    act(() => {
      vi.advanceTimersByTime(25)
    })
    fireEvent.mouseEnter(surface!)
    act(() => {
      vi.advanceTimersByTime(60)
    })

    expect(actions).toHaveClass("opacity-100")
  })

  it("shows a tooltip confirmation before deleting an entry", () => {
    const onDelete = vi.fn()

    render(
      <ResumeSectionActionButtonGroup
        isInteractive
        onDelete={onDelete}
        onEdit={() => undefined}
      >
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const surface = screen.getByText("Section body").parentElement

    expect(surface).not.toBeNull()

    fireEvent.mouseEnter(surface!)

    const deleteButton = screen.getByRole("button", { name: "deleteEntry" })

    fireEvent.click(deleteButton)

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole("tooltip")).toHaveTextContent("confirmDeleteEntry")

    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("renders an add action and triggers insertion", () => {
    const onAdd = vi.fn()

    render(
      <ResumeSectionActionButtonGroup isInteractive onAdd={onAdd}>
        <div>Section body</div>
      </ResumeSectionActionButtonGroup>
    )

    const surface = screen.getByText("Section body").parentElement

    expect(surface).not.toBeNull()

    fireEvent.mouseEnter(surface!)
    fireEvent.click(screen.getByRole("button", { name: "addEntry" }))

    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it("renders add/edit/delete actions as disabled while an AI resume action is running", () => {
    const store = createStore()
    store.set(chatThreadLifecycleAtom, "running")
    const onAdd = vi.fn()
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    render(
      <Provider store={store}>
        <ResumeSectionActionButtonGroup
          isInteractive
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        >
          <div>Section body</div>
        </ResumeSectionActionButtonGroup>
      </Provider>
    )

    const surface = screen.getByText("Section body").parentElement

    expect(surface).not.toBeNull()

    fireEvent.mouseEnter(surface!)

    const addButton = screen.getByRole("button", { name: "addEntry" })
    const editButton = screen.getByRole("button", { name: "editSection" })
    const deleteButton = screen.getByRole("button", { name: "deleteEntry" })

    expect(addButton).toBeDisabled()
    expect(editButton).toBeDisabled()
    expect(deleteButton).toBeDisabled()

    fireEvent.click(addButton)
    fireEvent.click(editButton)
    fireEvent.click(deleteButton)

    expect(onAdd).not.toHaveBeenCalled()
    expect(onEdit).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })
})
