import { atom, useAtomValue, useSetAtom } from "jotai"
import type { SessionSummary } from "@/lib/agent/chat-history"

export const chatSessionIdAtom = atom<string>("")
export const chatSessionAtom = atom<SessionSummary | null>(null)
export const chatSessionLoadingAtom = atom(false)
export const chatSessionsErrorAtom = atom<Error | null>(null)
export const chatSessionsAtom = atom<SessionSummary[]>([])
export const chatSessionsLoadingAtom = atom(false)
export const chatSessionsCreatingAtom = atom(false)
export const chatHistoryLoadingAtom = atom(false)
export type PendingChatHandoff = {
  id: string
  resumeId: string
  message: string
}
export const pendingChatHandoffAtom = atom<PendingChatHandoff | null>(null)

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

export function useChatHistoryLoadingValue() {
  return useAtomValue(chatHistoryLoadingAtom)
}

export function useSetChatHistoryLoading() {
  return useSetAtom(chatHistoryLoadingAtom)
}

export function usePendingChatHandoffValue() {
  return useAtomValue(pendingChatHandoffAtom)
}

export function useSetPendingChatHandoff() {
  return useSetAtom(pendingChatHandoffAtom)
}
