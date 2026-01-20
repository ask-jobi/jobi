"use client"
import React, { PropsWithChildren } from "react"
import { z } from "zod"

function I18NProvider({
  children,
  locale
}: PropsWithChildren<{ locale: string }>) {
  z.config(locale === "en" ? z.locales.en() : z.locales.zhCN())

  return <>{children}</>
}

export default I18NProvider
