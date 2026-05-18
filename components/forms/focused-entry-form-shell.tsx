"use client"

import { ReactNode, useEffect } from "react"
import {
  DefaultValues,
  FieldValues,
  FormProvider,
  UseFormReturn,
  useForm
} from "react-hook-form"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

interface FocusedEntryFormShellProps<T extends FieldValues> {
  entry: T
  formId: string
  onCancel?: () => void
  onSaveComplete?: () => void
  onSave: (values: T) => void | Promise<void>
  children: (methods: UseFormReturn<T>) => ReactNode
}

export function FocusedEntryFormShell<T extends FieldValues>({
  entry,
  formId,
  onCancel,
  onSaveComplete,
  onSave,
  children
}: FocusedEntryFormShellProps<T>) {
  const t = useTranslations()
  const methods = useForm<T>({
    defaultValues: entry as DefaultValues<T>,
    mode: "onChange"
  })
  const { handleSubmit, reset } = methods

  useEffect(() => {
    reset(entry as DefaultValues<T>)
  }, [entry, reset])

  const handleCancel = () => {
    reset(entry as DefaultValues<T>)
    onCancel?.()
  }

  return (
    <FormProvider {...methods}>
      <form
        id={formId}
        className="space-y-6"
        onSubmit={handleSubmit(async (values) => {
          await onSave(values)
          onSaveComplete?.()
        })}
      >
        {children(methods)}
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t("button.cancel")}
          </Button>
          <Button type="submit">{t("button.save")}</Button>
        </div>
      </form>
    </FormProvider>
  )
}
