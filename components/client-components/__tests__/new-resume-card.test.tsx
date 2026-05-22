/**
 * @vitest-environment jsdom
 */
import React, { useEffect } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import NewResumeCard from "../new-resume-card"

const mockPush = vi.fn()
const mockFetchEventSource = vi.fn()
const mockToastError = vi.fn()
const mockToastWarning = vi.fn()
const mockTrackStartResumeUpload = vi.fn()
const mockTrackOpenResumeUploadDialog = vi.fn()
const mockTrackSuccessResumeUpload = vi.fn()
const mockTrackFailedResumeUpload = vi.fn()
const mockTrackSelectResumeFile = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: (...args: unknown[]) => mockFetchEventSource(...args)
}))

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    warning: (...args: unknown[]) => mockToastWarning(...args)
  }
}))

vi.mock("@/lib/user-tracking/user-tracking", () => ({
  trackStartResumeUpload: (...args: unknown[]) =>
    mockTrackStartResumeUpload(...args),
  trackOpenResumeUploadDialog: (...args: unknown[]) =>
    mockTrackOpenResumeUploadDialog(...args),
  trackSuccessResumeUpload: (...args: unknown[]) =>
    mockTrackSuccessResumeUpload(...args),
  trackFailedResumeUpload: (...args: unknown[]) =>
    mockTrackFailedResumeUpload(...args),
  trackSelectResumeFile: (...args: unknown[]) =>
    mockTrackSelectResumeFile(...args)
}))

vi.mock("lucide-react", () => ({
  FileText: () => <span data-testid="file-text-icon" />
}))

vi.mock("../../ui/button", () => ({
  Button: ({ children, onClick, disabled, type = "button" }: any) => (
    <button disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  )
}))

vi.mock("../../ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>
}))

vi.mock("../../ui/dialog", async () => {
  const React = await import("react")

  const DialogContext = React.createContext<{
    open: boolean
    onOpenChange?: (open: boolean) => void
  }>({ open: false })

  return {
    Dialog: ({ open, onOpenChange, children }: any) => (
      <DialogContext.Provider value={{ open, onOpenChange }}>
        {children}
      </DialogContext.Provider>
    ),
    DialogTrigger: ({ children }: any) => {
      const ctx = React.useContext(DialogContext)
      return (
        <button onClick={() => ctx.onOpenChange?.(true)}>{children}</button>
      )
    },
    DialogContent: ({ children }: any) => {
      const ctx = React.useContext(DialogContext)
      if (!ctx.open) return null
      return (
        <div data-testid="dialog-content">
          {children}
          <button onClick={() => ctx.onOpenChange?.(false)} type="button">
            dialog-close
          </button>
        </div>
      )
    },
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>
  }
})

vi.mock("@/components/ui/stepper", async () => {
  const React = await import("react")

  return {
    defineStepper: (...steps: any[]) => {
      const StepperContext = React.createContext<any>(null)

      const Provider = ({ children }: any) => {
        const [index, setIndex] = React.useState(0)
        const methods = {
          all: steps,
          current: steps[index],
          isFirst: index === 0,
          isLast: index === steps.length - 1,
          next: () =>
            setIndex((value: number) => Math.min(value + 1, steps.length - 1)),
          prev: () => setIndex((value: number) => Math.max(value - 1, 0)),
          switch: (mapping: Record<string, () => React.ReactNode>) =>
            mapping[steps[index].id]?.() ?? null
        }

        return (
          <StepperContext.Provider value={methods}>
            {typeof children === "function" ? children({ methods }) : children}
          </StepperContext.Provider>
        )
      }

      return {
        Stepper: {
          Provider,
          Navigation: ({ children }: any) => <div>{children}</div>,
          Step: ({ children }: any) => <div>{children}</div>,
          Title: ({ children }: any) => <span>{children}</span>,
          Controls: ({ children }: any) => <div>{children}</div>
        }
      }
    }
  }
})

vi.mock("@/components/forms/job-information-form", () => {
  const formSchema = z.object({
    name: z.string().nonempty(),
    company: z.string().nonempty(),
    description: z.string().nonempty()
  })

  function MockJobInformationForm({ form }: any) {
    useEffect(() => {
      form.setValue("name", "Software Engineer")
      form.setValue("company", "Jobi")
      form.setValue("description", "Build product")
    }, [form])

    return <div>job-information-form</div>
  }

  return {
    formSchema,
    default: MockJobInformationForm
  }
})

vi.mock("@/components/resumes/resume-upload", () => ({
  default: ({ file, onSelectFile }: any) => (
    <div>
      <button
        onClick={() =>
          onSelectFile(
            new File(["pdf"], "resume.pdf", { type: "application/pdf" })
          )
        }
        type="button"
      >
        select-resume
      </button>
      <div data-testid="selected-file">{file?.name ?? "none"}</div>
    </div>
  )
}))

vi.mock("@/components/resumes/resume-analyze-progress", () => {
  const INTAKE_STEPS = [
    { id: "extract", status: "pending" },
    { id: "parse", status: "pending" },
    { id: "upload", status: "pending" },
    { id: "persist", status: "pending" },
    { id: "evaluate", status: "pending" }
  ]

  return {
    INTAKE_STEPS,
    default: ({ steps }: any) => (
      <div>
        {steps.map((step: any) => (
          <div data-testid={`step-${step.id}`} key={step.id}>
            {step.status}
          </div>
        ))}
      </div>
    )
  }
})

type FetchEventSourceOptions = {
  onopen?: (response: Response) => Promise<void> | void
  onmessage: (event: { data: string }) => void
  onerror: (error: unknown) => void
  signal: AbortSignal
}

async function openDialogAndStartAnalysis() {
  const renderResult = render(<NewResumeCard />)

  fireEvent.click(screen.getByRole("button", { name: /createNewResume/i }))

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /form.next/i }))
  })

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /select-resume/i })
    ).toBeInTheDocument()
  })

  fireEvent.click(screen.getByRole("button", { name: /select-resume/i }))

  await waitFor(() => {
    expect(screen.getByTestId("selected-file")).toHaveTextContent("resume.pdf")
  })

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /form.startAnalysis/i }))
  })

  await waitFor(() => {
    expect(mockFetchEventSource).toHaveBeenCalledTimes(1)
  })

  return {
    ...renderResult,
    options: mockFetchEventSource.mock.calls[0]?.[1] as FetchEventSourceOptions
  }
}

async function emitEvent(
  options: FetchEventSourceOptions,
  event: Record<string, unknown>
) {
  await act(async () => {
    options.onmessage({ data: JSON.stringify(event) })
  })
}

describe("NewResumeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchEventSource.mockResolvedValue(undefined)
  })

  it("filters non-active intake events and only navigates on active intake.done", async () => {
    const { options } = await openDialogAndStartAnalysis()

    await emitEvent(options, {
      type: "step.start",
      intakeId: "stale-before-start",
      step: "extract"
    })
    expect(screen.getByTestId("step-extract")).toHaveTextContent("pending")

    await emitEvent(options, { type: "intake.start", intakeId: "intake-1" })
    await emitEvent(options, {
      type: "step.start",
      intakeId: "intake-2",
      step: "parse"
    })
    await emitEvent(options, {
      type: "step.start",
      intakeId: "intake-1",
      step: "extract"
    })

    expect(screen.getByTestId("step-parse")).toHaveTextContent("pending")
    expect(screen.getByTestId("step-extract")).toHaveTextContent("loading")

    await emitEvent(options, {
      type: "intake.done",
      intakeId: "intake-2",
      applicationId: "app-stale",
      resumeId: "resume-stale"
    })
    await new Promise((resolve) => setTimeout(resolve, 850))
    expect(mockPush).not.toHaveBeenCalled()

    await emitEvent(options, {
      type: "intake.done",
      intakeId: "intake-1",
      applicationId: "app-1",
      resumeId: "resume-1"
    })
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/application/app-1")
    })
  })

  it("shows intake failure toast for the active intake", async () => {
    const { options } = await openDialogAndStartAnalysis()

    await emitEvent(options, { type: "intake.start", intakeId: "intake-1" })
    await emitEvent(options, {
      type: "step.failed",
      intakeId: "intake-1",
      step: "extract",
      error: { code: "PARSE_FAILED", userMessage: "bad parse" }
    })

    expect(screen.getByTestId("step-extract")).toHaveTextContent("error")

    await emitEvent(options, {
      type: "intake.failed",
      intakeId: "intake-1",
      error: { code: "PARSE_FAILED", userMessage: "bad parse" }
    })

    expect(mockToastError).toHaveBeenCalledWith("bad parse")
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("ends silently on intake.cancelled", async () => {
    const { options } = await openDialogAndStartAnalysis()

    await emitEvent(options, { type: "intake.start", intakeId: "intake-1" })
    await emitEvent(options, {
      type: "intake.cancelled",
      intakeId: "intake-1",
      reason: { code: "INTAKE_CANCELLED", userMessage: "cancelled" }
    })

    expect(mockToastError).not.toHaveBeenCalled()
    expect(mockTrackFailedResumeUpload).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("surfaces the JSON error message when the upload endpoint does not return SSE", async () => {
    mockFetchEventSource.mockImplementation(
      async (_url: string, options: FetchEventSourceOptions) => {
        const response = new Response(
          JSON.stringify({ error: "Only PDF files are supported" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json"
            }
          }
        )

        try {
          await options.onopen?.(response)
        } catch (error) {
          return options.onerror(error)
        }
      }
    )

    await openDialogAndStartAnalysis()

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Only PDF files are supported"
      )
    })
    expect(mockTrackFailedResumeUpload).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Only PDF files are supported" })
    )
  })

  it("aborts the in-flight request when the dialog closes", async () => {
    let pendingResolve!: () => void
    mockFetchEventSource.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          pendingResolve = resolve
        })
    )

    const { options } = await openDialogAndStartAnalysis()

    expect(options.signal.aborted).toBe(false)
    fireEvent.click(screen.getByRole("button", { name: /dialog-close/i }))
    expect(options.signal.aborted).toBe(true)

    pendingResolve()
  })

  it("aborts the in-flight request when the component unmounts", async () => {
    let pendingResolve!: () => void
    mockFetchEventSource.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          pendingResolve = resolve
        })
    )

    const { options, unmount } = await openDialogAndStartAnalysis()

    expect(options.signal.aborted).toBe(false)
    unmount()
    expect(options.signal.aborted).toBe(true)

    pendingResolve()
  })
})
