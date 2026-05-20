/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SectionEntries } from "@/components/resume-templates/section-entries"
import { chatThreadLifecycleAtom } from "@/lib/store/chat"
import type { ResumeData } from "@/types/resume"

let latestDndHandlers: {
  onDragOver?: (event: {
    active: { id: string }
    over: { id: string } | null
  }) => void
  onDragEnd?: (event: {
    active: { id: string }
    over: { id: string } | null
  }) => void
  onDragCancel?: () => void
} = {}

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragOver, onDragEnd, onDragCancel }: any) => {
    latestDndHandlers = { onDragOver, onDragEnd, onDragCancel }
    return <div data-testid="mock-dnd-context">{children}</div>
  },
  PointerSensor: function PointerSensor() {
    return null
  },
  closestCenter: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn((...sensors: unknown[]) => sensors)
}))

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => children,
  verticalListSortingStrategy: {},
  arrayMove: (items: string[], fromIndex: number, toIndex: number) => {
    const nextItems = [...items]
    const [movedItem] = nextItems.splice(fromIndex, 1)

    if (typeof movedItem === "undefined") {
      return items
    }

    nextItems.splice(toIndex, 0, movedItem)
    return nextItems
  },
  useSortable: ({ id }: { id: string }) => ({
    attributes: { "data-sortable-id": id },
    listeners: {},
    setNodeRef: () => undefined,
    transform: null,
    transition: undefined,
    isDragging: false
  })
}))

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => undefined
    }
  }
}))

function createEducationSection() {
  const resume: ResumeData = {
    sectionOrder: ["education", "skills"],
    personalInfo: {
      entryId: "pi-1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "123"
    },
    education: {
      entries: [
        {
          entryId: "edu-1",
          school: "School 1",
          degree: "Degree 1",
          start: "2020-01",
          end: "2021-01",
          content: "One"
        },
        {
          entryId: "edu-2",
          school: "School 2",
          degree: "Degree 2",
          start: "2021-01",
          end: "2022-01",
          content: "Two"
        },
        {
          entryId: "edu-3",
          school: "School 3",
          degree: "Degree 3",
          start: "2022-01",
          end: "2023-01",
          content: "Three"
        }
      ]
    },
    skills: {
      entries: []
    }
  }

  return resume.education
}

type EducationEntryReorderHandler = (
  id: "education",
  fromIndex: number,
  toIndex: number
) => void | Promise<boolean>

function renderSectionEntries(
  section = createEducationSection(),
  {
    aiRunning = false,
    onEntryReorder = vi.fn<EducationEntryReorderHandler>()
  }: {
    aiRunning?: boolean
    onEntryReorder?: EducationEntryReorderHandler
  } = {}
) {
  const store = createStore()

  if (aiRunning) {
    store.set(chatThreadLifecycleAtom, "running")
  }

  const view = render(
    <Provider store={store}>
      <SectionEntries
        sectionId="education"
        section={section}
        sectionTitle="Education"
        isInteractive
        onEntryReorder={onEntryReorder}
        headRender={(entry) => (
          <div data-testid="entry-label">{entry.school}</div>
        )}
        entryRender={(entry) => <div>{entry.degree}</div>}
      />
    </Provider>
  )

  return { store, onEntryReorder, ...view }
}

describe("SectionEntries drag reorder", () => {
  beforeEach(() => {
    latestDndHandlers = {}
  })

  it("shows drag handles only when a section has more than one entry", () => {
    renderSectionEntries()

    expect(
      screen.getAllByRole("button", { name: "reorderEntry" })
    ).toHaveLength(3)
  })

  it("hides drag handles when a section has only one entry", () => {
    renderSectionEntries({
      entries: [createEducationSection().entries[0]]
    })

    expect(
      screen.queryByRole("button", { name: "reorderEntry" })
    ).not.toBeInTheDocument()
  })

  it("disables drag handles while an AI resume action is running", () => {
    renderSectionEntries(createEducationSection(), { aiRunning: true })

    expect(
      screen.queryByRole("button", { name: "reorderEntry" })
    ).not.toBeInTheDocument()
  })

  it("previews the new order during drag and persists it on drop", () => {
    const onEntryReorder = vi.fn()
    renderSectionEntries(createEducationSection(), { onEntryReorder })

    expect(
      screen.getAllByTestId("entry-label").map((item) => item.textContent)
    ).toEqual(["School 1", "School 2", "School 3"])

    act(() => {
      latestDndHandlers.onDragOver?.({
        active: { id: "edu-1" },
        over: { id: "edu-3" }
      })
    })

    expect(
      screen.getAllByTestId("entry-label").map((item) => item.textContent)
    ).toEqual(["School 2", "School 3", "School 1"])

    act(() => {
      latestDndHandlers.onDragEnd?.({
        active: { id: "edu-1" },
        over: { id: "edu-3" }
      })
    })

    expect(onEntryReorder).toHaveBeenCalledWith("education", 0, 2)
  })
})
