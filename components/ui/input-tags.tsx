"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"

type InputTagsProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange"
> & {
  value: string | undefined
  onChange: React.Dispatch<string>
}

const InputTags = React.forwardRef<HTMLInputElement, InputTagsProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [pendingDataPoint, setPendingDataPoint] = React.useState("")
    const valueList = useMemo(() => (value ? value?.split(",") : []), [value])

    React.useEffect(() => {
      if (pendingDataPoint.includes(",")) {
        const newDataPoints = new Set([
          ...valueList,
          ...pendingDataPoint.split(",").map((chunk) => chunk.trim())
        ])
        console.log(newDataPoints)
        onChange(Array.from(newDataPoints).join(","))
        setPendingDataPoint("")
      }
    }, [pendingDataPoint, onChange, valueList])

    const addPendingDataPoint = () => {
      if (pendingDataPoint) {
        const newDataPoints = new Set([...valueList, pendingDataPoint])
        onChange(Array.from(newDataPoints).join(","))
        setPendingDataPoint("")
      }
    }

    return (
      <div
        className={cn(
          "border-input dark:bg-input/30 flex min-h-10 w-full flex-wrap gap-2 rounded-md border bg-transparent px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        {valueList.map((item) => (
          <Badge key={item} variant="secondary">
            <span className="block max-w-xs truncate break-words">{item}</span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 size-4 p-0"
              onClick={() => {
                onChange(valueList.filter((i) => i !== item).join(","))
              }}
            >
              <XIcon />
            </Button>
          </Badge>
        ))}
        <input
          className="placeholder:text-muted-foreground flex-1 outline-none"
          value={pendingDataPoint}
          onChange={(e) => setPendingDataPoint(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              addPendingDataPoint()
            } else if (
              e.key === "Backspace" &&
              pendingDataPoint.length === 0 &&
              valueList.length > 0
            ) {
              e.preventDefault()
              onChange(valueList.slice(0, -1).join(","))
            }
          }}
          {...props}
          ref={ref}
        />
      </div>
    )
  }
)

InputTags.displayName = "InputTags"

export { InputTags }
