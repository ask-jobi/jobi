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

interface FocusedBlockFormShellProps<T extends FieldValues> {
  block: T
  formId: string
  onCancel?: () => void
  onSaveComplete?: () => void
  onSave: (values: T) => void
  children: (methods: UseFormReturn<T>) => ReactNode
}

export function FocusedBlockFormShell<T extends FieldValues>({
  block,
  formId,
  onCancel,
  onSaveComplete,
  onSave,
  children
}: FocusedBlockFormShellProps<T>) {
  const t = useTranslations()
  const methods = useForm<T>({
    defaultValues: block as DefaultValues<T>,
    mode: "onChange"
  })
  const { handleSubmit, reset } = methods

  useEffect(() => {
    reset(block as DefaultValues<T>)
  }, [block, reset])

  const handleCancel = () => {
    reset(block as DefaultValues<T>)
    onCancel?.()
  }

  return (
    <FormProvider {...methods}>
      <form
        id={formId}
        className="space-y-6"
        onSubmit={handleSubmit((values) => {
          onSave(values)
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
