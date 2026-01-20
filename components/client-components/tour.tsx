"use client"

import { AnimatePresence, motion } from "motion/react"
import React from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react"

export interface TourStep {
  content: (context: TourContextType) => React.ReactNode
  selectorId: string
  width?: number
  height?: number
  onClickWithinArea?: () => void
  position?: "top" | "bottom" | "left" | "right"
}

interface TourContextType {
  currentStep: number
  totalSteps: number
  nextStep: () => void
  previousStep: () => void
  endTour: () => void
  isActive: boolean
  startTour: () => void
  setSteps: (steps: TourStep[]) => void
  gotoStep: (index: number) => void
  removeStep: (selectorId?: string) => void
  insertStep: (step: TourStep, index: number) => void
  steps: TourStep[]
  isTourCompleted: boolean
  setIsTourCompleted: (completed: boolean) => void
}

interface TourProviderProps {
  children: React.ReactNode
  onComplete?: () => void
  className?: string
  isTourCompleted?: boolean
}

const TourContext = createContext<TourContextType | null>(null)

const MASK_PADDING = 4
const PADDING = 16
const CONTENT_WIDTH = 300
const CONTENT_HEIGHT = 200

function getElementPosition(id: string) {
  const element = document.getElementById(id)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  }
}

function calculateContentPosition(
  elementPos: { top: number; left: number; width: number; height: number },
  position: "top" | "bottom" | "left" | "right" = "bottom"
) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = elementPos.left
  let top = elementPos.top

  switch (position) {
    case "top":
      top = elementPos.top - CONTENT_HEIGHT - PADDING
      left = elementPos.left - MASK_PADDING
      break
    case "bottom":
      top = elementPos.top + elementPos.height + PADDING
      left = elementPos.left - MASK_PADDING
      break
    case "left":
      left = elementPos.left - CONTENT_WIDTH - PADDING
      top = elementPos.top - MASK_PADDING
      break
    case "right":
      left = elementPos.left + elementPos.width + PADDING
      top = elementPos.top - MASK_PADDING
      break
  }

  return {
    top: Math.max(
      PADDING,
      Math.min(top, viewportHeight - CONTENT_HEIGHT - PADDING)
    ),
    left: Math.max(
      PADDING,
      Math.min(left, viewportWidth - CONTENT_WIDTH - PADDING)
    ),
    width: CONTENT_WIDTH,
    height: CONTENT_HEIGHT
  }
}

export function TourProvider({
  children,
  onComplete,
  isTourCompleted = false
}: TourProviderProps) {
  const [steps, setSteps] = useState<TourStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [elementPosition, setElementPosition] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const [isCompleted, setIsCompleted] = useState(isTourCompleted)

  const updateElementPosition = useCallback(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const position = getElementPosition(steps[currentStep]?.selectorId ?? "")
      if (position) {
        setElementPosition(position)
      }
    }
  }, [currentStep, steps])

  const removeStep = (selectorId?: string) => {
    const tempSelectorId = selectorId ?? steps[currentStep].selectorId
    const newSteps = steps.filter((it) => it.selectorId !== tempSelectorId)
    setSteps(newSteps)

    // 更新currentStep
    const currentIndex = steps.findIndex(
      (it) => it.selectorId === tempSelectorId
    )
    if (currentIndex === -1) return

    if (newSteps.length === 0) {
      endTour()
      setIsTourCompleted(true)
      onComplete?.()
    } else {
      // 如果删除的是当前步骤,则移动到下一个步骤
      // 如果删除的是后面的步骤,则保持当前步骤不变
      if (currentIndex === currentStep) {
        setCurrentStep(Math.min(currentStep, newSteps.length - 1))
      }
    }
  }

  const insertStep = (step: TourStep, index: number) => {
    setSteps((prevSteps) => {
      const firstPart = prevSteps.slice(0, index)
      const secondPart = prevSteps.slice(index)
      return [...firstPart, step, ...secondPart]
    })
  }

  const gotoStep = useCallback((index: number) => {
    setCurrentStep(index)
  }, [])

  useEffect(() => {
    const element = document.getElementById(
      steps[currentStep]?.selectorId ?? ""
    )
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          if (entry.isIntersecting) {
            setTimeout(() => {
              updateElementPosition()
              observer.disconnect()
            }, 600)
          }
        },
        {
          threshold: 1.0,
          rootMargin: "0px"
        }
      )

      observer.observe(element)

      return () => {
        observer.disconnect()
      }
    }
  }, [currentStep, steps, updateElementPosition])

  useEffect(() => {
    window.addEventListener("resize", updateElementPosition)
    window.addEventListener("scroll", updateElementPosition)

    return () => {
      window.removeEventListener("resize", updateElementPosition)
      window.removeEventListener("scroll", updateElementPosition)
    }
  }, [updateElementPosition])

  const setIsTourCompleted = useCallback((completed: boolean) => {
    setIsCompleted(completed)
  }, [])

  const nextStep = useCallback(async () => {
    setCurrentStep((prev) => {
      if (prev >= steps.length - 1) {
        return -1
      }
      return prev + 1
    })

    if (currentStep === steps.length - 1) {
      setIsTourCompleted(true)
      onComplete?.()
    }
  }, [steps.length, onComplete, currentStep, setIsTourCompleted])

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const endTour = useCallback(() => {
    setCurrentStep(-1)
  }, [])

  const startTour = useCallback(() => {
    if (isTourCompleted) {
      return
    }
    setCurrentStep(0)
  }, [isTourCompleted])

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (
        currentStep >= 0 &&
        elementPosition &&
        steps[currentStep]?.onClickWithinArea
      ) {
        const clickX = e.clientX + window.scrollX
        const clickY = e.clientY + window.scrollY

        const isWithinBounds =
          clickX >= elementPosition.left &&
          clickX <=
            elementPosition.left +
              (steps[currentStep]?.width || elementPosition.width) &&
          clickY >= elementPosition.top &&
          clickY <=
            elementPosition.top +
              (steps[currentStep]?.height || elementPosition.height)

        if (isWithinBounds) {
          steps[currentStep].onClickWithinArea?.()
        }
      }
    },
    [currentStep, elementPosition, steps]
  )

  useEffect(() => {
    window.addEventListener("click", handleClick)
    return () => {
      window.removeEventListener("click", handleClick)
    }
  }, [handleClick])

  const tourValue = {
    currentStep,
    totalSteps: steps.length,
    nextStep,
    previousStep,
    endTour,
    isActive: currentStep >= 0,
    startTour,
    setSteps,
    gotoStep,
    insertStep,
    removeStep,
    steps,
    isTourCompleted: isCompleted,
    setIsTourCompleted
  }

  return (
    <TourContext.Provider value={tourValue}>
      {children}
      <AnimatePresence>
        {currentStep >= 0 && elementPosition && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-hidden"
            >
              <svg
                className="absolute inset-0 h-full w-full"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%"
                }}
              >
                <defs>
                  <mask id="tour-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <motion.rect
                      initial={{
                        x: elementPosition.left - MASK_PADDING,
                        y: elementPosition.top - MASK_PADDING,
                        width:
                          (steps[currentStep]?.width || elementPosition.width) +
                          2 * MASK_PADDING,
                        height:
                          (steps[currentStep]?.height ||
                            elementPosition.height) +
                          2 * MASK_PADDING
                      }}
                      animate={{
                        x: elementPosition.left - MASK_PADDING,
                        y: elementPosition.top - MASK_PADDING,
                        width:
                          (steps[currentStep]?.width || elementPosition.width) +
                          2 * MASK_PADDING,
                        height:
                          (steps[currentStep]?.height ||
                            elementPosition.height) +
                          2 * MASK_PADDING
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut"
                      }}
                      rx="8"
                      ry="8"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="black"
                  opacity="0.5"
                  mask="url(#tour-mask)"
                />
              </svg>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10, top: 50, right: 50 }}
              animate={{
                opacity: 1,
                y: 0,
                top: calculateContentPosition(
                  elementPosition,
                  steps[currentStep]?.position
                ).top,
                left: calculateContentPosition(
                  elementPosition,
                  steps[currentStep]?.position
                ).left
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                opacity: { duration: 0.4 }
              }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: "fixed",
                width: elementPosition.width + 2 * MASK_PADDING
              }}
              className="bg-background relative z-[100] rounded-lg border p-4 shadow-lg"
            >
              <div className="text-muted-foreground absolute right-4 top-4 text-xs">
                {currentStep + 1} / {steps.length}
              </div>
              <AnimatePresence mode="wait">
                <div>
                  <motion.div
                    key={`tour-content-${currentStep}`}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    className="overflow-hidden"
                    transition={{
                      duration: 0.2,
                      height: {
                        duration: 0.4
                      }
                    }}
                  >
                    {steps[currentStep]?.content(tourValue)}
                  </motion.div>
                </div>
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return context
}
