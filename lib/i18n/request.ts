import { getRequestConfig } from "next-intl/server"
import { getUserLocale } from "@/lib/i18n/services"

export default getRequestConfig(async () => {
  const locale = await getUserLocale()

  return {
    locale,
    messages: (await import(`./translations/${locale}.json`)).default
  }
})
