"use client"

import { useCallback } from "react"
import {
  useChatThreadLifecycleValue,
  useDispatchChatThreadLifecycle
} from "@/lib/store/chat"

export function useChatThreadLifecycle() {
  const lifecycle = useChatThreadLifecycleValue()
  const dispatch = useDispatchChatThreadLifecycle()

  return {
    lifecycle,
    resetLifecycle: useCallback(() => dispatch({ type: "RESET" }), [dispatch]),
    markHistoryLoading: useCallback(
      () => dispatch({ type: "HISTORY_LOAD_STARTED" }),
      [dispatch]
    ),
    markHistoryLoaded: useCallback(
      () => dispatch({ type: "HISTORY_LOAD_FINISHED" }),
      [dispatch]
    ),
    markThreadSynced: useCallback(
      () => dispatch({ type: "THREAD_SYNCED" }),
      [dispatch]
    ),
    markRunStarted: useCallback(
      () => dispatch({ type: "RUN_STARTED" }),
      [dispatch]
    ),
    markRunFinished: useCallback(
      () => dispatch({ type: "RUN_FINISHED" }),
      [dispatch]
    ),
    markFailed: useCallback(() => dispatch({ type: "FAILED" }), [dispatch])
  }
}
