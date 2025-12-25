"use client"
import {zodResolver} from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {useResume} from "@/lib/store/resume";
import { Button } from "@/components/ui/button";
import {updateResumeJobDescription} from "@/server/resume";
import {useEffect} from "react";
import JobInformationForm, {formSchema, JobInfoFormType} from "@/components/forms/job-information-form";

export default function Page() {
  const {jobDescription, setJobDescription} = useResume()
  const form = useForm<JobInfoFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      description: "",
    },
  });

  useEffect(() => {
    if (jobDescription) {
      form.reset(jobDescription)
    }
  }, [jobDescription, form]);

  const handleSaveJd = async () => {
    const data = {
      id: jobDescription!!.id,
      ...form.getValues()
    }
    setJobDescription(data)
    await updateResumeJobDescription(data)
  }

  return (
    <main className="mx-24">
      <div className="flex flex-col gap-4 mt-4 p-4">
        <JobInformationForm form={form}/>
        <div className="flex flex-row-reverse">
          <Button onClick={handleSaveJd}>Save</Button>
        </div>
      </div>
    </main>
  )
}
