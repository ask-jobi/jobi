import { atom, useAtomValue, useSetAtom } from "jotai"
import type { SessionSummary } from "@/lib/agent/chat-history"

export const chatSessionIdAtom = atom<string>("")
export const chatSessionsAtom = atom<SessionSummary[]>([])
export const chatSessionsLoadingAtom = atom(false)
export const chatSessionsCreatingAtom = atom(false)
export const chatSessionsErrorAtom = atom<Error | null>(null)

export function useChatSessionIdValue() {
  return useAtomValue(chatSessionIdAtom)
}

export function useSetChatSessionId() {
  return useSetAtom(chatSessionIdAtom)
}

export function useChatSessionsValue() {
  return useAtomValue(chatSessionsAtom)
}

export function useSetChatSessions() {
  return useSetAtom(chatSessionsAtom)
}

export function useChatSessionsLoadingValue() {
  return useAtomValue(chatSessionsLoadingAtom)
}

export function useSetChatSessionsLoading() {
  return useSetAtom(chatSessionsLoadingAtom)
}

export function useChatSessionsCreatingValue() {
  return useAtomValue(chatSessionsCreatingAtom)
}

export function useSetChatSessionsCreating() {
  return useSetAtom(chatSessionsCreatingAtom)
}

export function useChatSessionsErrorValue() {
  return useAtomValue(chatSessionsErrorAtom)
}

export function useSetChatSessionsError() {
  return useSetAtom(chatSessionsErrorAtom)
}
