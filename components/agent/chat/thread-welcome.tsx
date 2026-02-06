"use client"

import { useTranslations } from "next-intl"

export function ThreadWelcome() {
  const t = useTranslations("chat")
  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-[44rem] grow flex-col items-center justify-center text-muted-foreground">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-3 opacity-50"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <p className="text-sm font-medium">{t("startConversation")}</p>
      <p className="text-xs">{t("askToOptimizeResume")}</p>
    </div>
  )
}
