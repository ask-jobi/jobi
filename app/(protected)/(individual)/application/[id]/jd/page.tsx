"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useApplicationResume } from "@/lib/store/resume"
import { Button } from "@/components/ui/button"
import { updateResumeJobDescription } from "@/server/resume"
import { useEffect, useState } from "react"
import JobInformationForm, {
  formSchema,
  JobInfoFormType
} from "@/components/forms/job-information-form"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function Page() {
  const t = useTranslations()
  const { jobDescription, setJobDescription } = useApplicationResume()
  const [loading, setLoading] = useState(false)
  const form = useForm<JobInfoFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      description: ""
    }
  })

  useEffect(() => {
    if (jobDescription) {
      form.reset(jobDescription)
    }
  }, [jobDescription, form])

  const handleSaveJd = async () => {
    setLoading(true)
    try {
      const data = {
        id: jobDescription!!.id,
        ...form.getValues()
      }
      setJobDescription(data)
      await updateResumeJobDescription(data)
      toast.success(t("jd.saveSuccess"))
    } catch {
      toast.error(t("jd.saveError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-24">
      <div className="flex flex-col gap-4 mt-4 p-4">
        <JobInformationForm form={form} disabled={loading} />
        <div className="flex flex-row-reverse">
          <Button onClick={handleSaveJd} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("button.save")}
          </Button>
        </div>
      </div>
    </main>
  )
}
