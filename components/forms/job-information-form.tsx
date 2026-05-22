"use client"
import React from "react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn } from "react-hook-form"
import { useTranslations } from "next-intl"
import {
  jobInfoFormSchema,
  type JobInfoFormType
} from "@/lib/job-info-form-schema"

export { jobInfoFormSchema as formSchema }
export type { JobInfoFormType }

type JobInformationFormProps = {
  form: UseFormReturn<JobInfoFormType>
  disabled?: boolean
}

function JobInformationForm({ form, disabled }: JobInformationFormProps) {
  const t = useTranslations("form.job")
  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-destructive">
                {t("name")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("namePlaceholder")}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-destructive">
                {t("company")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("companyPlaceholder")}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-destructive">
                {t("desc")}
              </FormLabel>
              <FormControl>
                <Textarea
                  className="max-h-48"
                  placeholder={t("descPlaceholder")}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default JobInformationForm
