/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import ClientOnly from "../client-only"

describe("ClientOnly", () => {
  it("should render children when mounted", () => {
    const { container } = render(
      <ClientOnly>
        <div data-testid="child">Child Content</div>
      </ClientOnly>
    )

    expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument()
    expect(screen.getByText("Child Content")).toBeInTheDocument()
  })

  it("should handle multiple children", () => {
    render(
      <ClientOnly>
        <span data-testid="child1">Child 1</span>
        <span data-testid="child2">Child 2</span>
      </ClientOnly>
    )

    expect(screen.getByTestId("child1")).toBeInTheDocument()
    expect(screen.getByTestId("child2")).toBeInTheDocument()
  })

  it("should handle empty children", () => {
    const { container } = render(<ClientOnly></ClientOnly>)

    expect(container.textContent).toBe("")
  })

  it("should render nested content correctly", () => {
    render(
      <ClientOnly>
        <div>
          <h1>Title</h1>
          <p>Paragraph content</p>
        </div>
      </ClientOnly>
    )

    expect(screen.getByRole("heading")).toHaveTextContent("Title")
    expect(screen.getByText("Paragraph content")).toBeInTheDocument()
  })

  it("should preserve child component state", () => {
    const ChildComponent = () => {
      return <span data-testid="child">Child Component</span>
    }

    render(
      <ClientOnly>
        <ChildComponent />
      </ClientOnly>
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Child Component")).toBeInTheDocument()
  })
})
