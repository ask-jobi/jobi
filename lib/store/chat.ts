import { atom, useAtomValue, useSetAtom } from "jotai"
import type { SessionSummary } from "@/lib/agent/chat-history"

export const chatSessionIdAtom = atom<string>("")
export const chatSessionAtom = atom<SessionSummary | null>(null)
export const chatSessionLoadingAtom = atom(false)
export const chatSessionErrorAtom = atom<Error | null>(null)
export const chatHistoryLoadingAtom = atom(false)
export type ChatThreadLifecycle =
  | "idle"
  | "loading-history"
  | "syncing-thread"
  | "ready"
  | "running"
  | "error"
export type ChatThreadLifecycleAction =
  | { type: "RESET" }
  | { type: "HISTORY_LOAD_STARTED" }
  | { type: "HISTORY_LOAD_FINISHED" }
  | { type: "THREAD_SYNCED" }
  | { type: "RUN_STARTED" }
  | { type: "RUN_FINISHED" }
  | { type: "FAILED" }
export type PendingChatAction = {
  id: string
  resumeId: string
  message: string
}
export const chatThreadLifecycleAtom = atom<ChatThreadLifecycle>("idle")
export const dispatchChatThreadLifecycleAtom = atom(
  null,
  (get, set, action: ChatThreadLifecycleAction) => {
    const state = get(chatThreadLifecycleAtom)

    switch (action.type) {
      case "RESET":
        set(chatThreadLifecycleAtom, "idle")
        return
      case "HISTORY_LOAD_STARTED":
        set(chatThreadLifecycleAtom, "loading-history")
        return
      case "HISTORY_LOAD_FINISHED":
        set(chatThreadLifecycleAtom, "syncing-thread")
        return
      case "THREAD_SYNCED":
        set(chatThreadLifecycleAtom, "ready")
        return
      case "RUN_STARTED":
        set(chatThreadLifecycleAtom, "running")
        return
      case "RUN_FINISHED":
        set(chatThreadLifecycleAtom, state === "error" ? state : "ready")
        return
      case "FAILED":
        set(chatThreadLifecycleAtom, "error")
        return
      default:
        return
    }
  }
)
export const pendingChatActionAtom = atom<PendingChatAction | null>(null)

export function useChatSessionIdValue() {
  return useAtomValue(chatSessionIdAtom)
}

export function useSetChatSessionId() {
  return useSetAtom(chatSessionIdAtom)
}

export function useChatSessionValue() {
  return useAtomValue(chatSessionAtom)
}

export function useSetChatSession() {
  return useSetAtom(chatSessionAtom)
}

export function useChatSessionLoadingValue() {
  return useAtomValue(chatSessionLoadingAtom)
}

export function useSetChatSessionLoading() {
  return useSetAtom(chatSessionLoadingAtom)
}

export function useChatSessionErrorValue() {
  return useAtomValue(chatSessionErrorAtom)
}

export function useSetChatSessionError() {
  return useSetAtom(chatSessionErrorAtom)
}

export function useChatHistoryLoadingValue() {
  return useAtomValue(chatHistoryLoadingAtom)
}

export function useSetChatHistoryLoading() {
  return useSetAtom(chatHistoryLoadingAtom)
}

export function useChatThreadLifecycleValue() {
  return useAtomValue(chatThreadLifecycleAtom)
}

export function useDispatchChatThreadLifecycle() {
  return useSetAtom(dispatchChatThreadLifecycleAtom)
}

export function usePendingChatActionValue() {
  return useAtomValue(pendingChatActionAtom)
}

export function useSetPendingChatAction() {
  return useSetAtom(pendingChatActionAtom)
}
