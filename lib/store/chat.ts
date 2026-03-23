import { atom, useAtomValue, useSetAtom } from "jotai"

export const chatSessionIdAtom = atom<string>("")

export function useChatSessionIdValue() {
  return useAtomValue(chatSessionIdAtom)
}

export function useSetChatSessionId() {
  return useSetAtom(chatSessionIdAtom)
}
