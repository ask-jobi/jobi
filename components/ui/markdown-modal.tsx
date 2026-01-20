"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Editor } from "@/components/editor/editor"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface MarkdownModalProps {
  isOpen: boolean
  onClose: () => void
  markdown: string
  onChange: (markdown: string) => void
  title: string
}

export function MarkdownModal({
  isOpen,
  onClose,
  markdown,
  onChange,
  title
}: MarkdownModalProps) {
  const t = useTranslations()
  const [tempContent, setTempContent] = React.useState(markdown)

  React.useEffect(() => {
    if (isOpen) {
      setTempContent(markdown)
    }
  }, [markdown, isOpen])

  const handleSave = () => {
    onChange(tempContent)
    onClose()
  }

  const handleCancel = () => {
    setTempContent(markdown)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {title}
            <DialogDescription />
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <Editor markdown={tempContent} onChange={setTempContent} />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            {t("button.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("button.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
