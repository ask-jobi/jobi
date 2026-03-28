"use client"

import { useCallback, useReducer } from "react"
import type { ChatThreadLifecycle } from "@/lib/store/chat"

type ChatThreadLifecycleAction =
  | { type: "RESET" }
  | { type: "HISTORY_LOAD_STARTED" }
  | { type: "HISTORY_LOAD_FINISHED" }
  | { type: "THREAD_SYNCED" }
  | { type: "RUN_STARTED" }
  | { type: "RUN_FINISHED" }
  | { type: "FAILED" }

function lifecycleReducer(
  state: ChatThreadLifecycle,
  action: ChatThreadLifecycleAction
): ChatThreadLifecycle {
  switch (action.type) {
    case "RESET":
      return "idle"
    case "HISTORY_LOAD_STARTED":
      return "loading-history"
    case "HISTORY_LOAD_FINISHED":
      return "syncing-thread"
    case "THREAD_SYNCED":
      return "ready"
    case "RUN_STARTED":
      return "running"
    case "RUN_FINISHED":
      return state === "error" ? state : "ready"
    case "FAILED":
      return "error"
    default:
      return state
  }
}

export function useChatThreadLifecycle() {
  const [lifecycle, dispatch] = useReducer(lifecycleReducer, "idle")

  return {
    lifecycle,
    resetLifecycle: useCallback(() => dispatch({ type: "RESET" }), []),
    markHistoryLoading: useCallback(
      () => dispatch({ type: "HISTORY_LOAD_STARTED" }),
      []
    ),
    markHistoryLoaded: useCallback(
      () => dispatch({ type: "HISTORY_LOAD_FINISHED" }),
      []
    ),
    markThreadSynced: useCallback(
      () => dispatch({ type: "THREAD_SYNCED" }),
      []
    ),
    markRunStarted: useCallback(() => dispatch({ type: "RUN_STARTED" }), []),
    markRunFinished: useCallback(() => dispatch({ type: "RUN_FINISHED" }), []),
    markFailed: useCallback(() => dispatch({ type: "FAILED" }), [])
  }
}
