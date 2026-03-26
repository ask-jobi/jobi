import { atom, useAtomValue, useSetAtom } from "jotai"
import type { SessionSummary } from "@/lib/agent/chat-history"

export const chatSessionIdAtom = atom<string>("")
export const chatSessionAtom = atom<SessionSummary | null>(null)
export const chatSessionLoadingAtom = atom(false)
export const chatSessionsErrorAtom = atom<Error | null>(null)

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

export function useChatSessionsErrorValue() {
  return useAtomValue(chatSessionsErrorAtom)
}

export function useSetChatSessionsError() {
  return useSetAtom(chatSessionsErrorAtom)
}
