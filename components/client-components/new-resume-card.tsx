"use client"

import {Button} from "../ui/button"
import {Card, CardContent} from "../ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog"
import {defineStepper} from "@/components/stepper";
import JobInformationForm, {formSchema, JobInfoFormType} from "@/components/client-components/job-information-form";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import ResumeUpload from "@/components/client-components/resume-upload";
import {saveJobInfoAndUploadResume} from "@/server/resume";
import {toast} from "sonner";

const {Stepper} = defineStepper(
  {id: "step-1", title: "Job Information"},
  {id: "step-2", title: "Upload Resume"}
);

const NewResumeCard = () => {
  const [cardOpen, setCardOpen] = useState<boolean>(false)
  const [resumeFile, setResumeFile] = useState<File>()
  const form = useForm<JobInfoFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      description: ""
    },
  })

  const handleOpenDialog = (open: boolean) => {
    setCardOpen(open)
  }

  const handleSubmit = async () => {
    if (!resumeFile) {
      toast.warning('Please upload one resume when goto next step.')
      return
    }
    try {
      await saveJobInfoAndUploadResume(form.getValues(), resumeFile)
    } catch (e: any) {
      toast.error(e.toString())
      return
    }
    setCardOpen(false)
  }

  const handleNext = async (methods: any) => {
    if (methods.current.id === "step-1") {
      const isValid = await form.trigger()
      if (!isValid) {
        return
      }
    }
    methods.next()
  }

  return (
    <Dialog open={cardOpen} onOpenChange={handleOpenDialog}>
      <DialogTrigger asChild>
        <Card
          className="aspect-[1/1.414] border-dashed cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary"
        >
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-lg font-medium text-muted-foreground select-none">Create New Resume</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Resume</DialogTitle>
          <DialogDescription/>
        </DialogHeader>
        <Stepper.Provider className="space-y-4">
          {({methods}) => (
            <>
              <Stepper.Navigation>
                {methods.all.map((step) => (
                  <Stepper.Step key={step.id} of={step.id} onClick={() => methods.goTo(step.id)}>
                    <Stepper.Title>{step.title}</Stepper.Title>
                  </Stepper.Step>
                ))}
              </Stepper.Navigation>
              {methods.switch({
                "step-1": () => <JobInformationForm form={form}/>,
                "step-2": () => <ResumeUpload file={resumeFile} onSelectFile={setResumeFile}/>
              })}
              <Stepper.Controls>
                <Button
                  variant="secondary"
                  onClick={methods.prev}
                  disabled={methods.isFirst}
                >
                  Previous
                </Button>
                {
                  methods.isLast ?
                    <Button
                      onClick={handleSubmit}
                      disabled={!resumeFile}
                    >
                      Done
                    </Button> :
                    <Button onClick={() => handleNext(methods)}>
                      Next
                    </Button>
                }
              </Stepper.Controls>
            </>
          )}
        </Stepper.Provider>
      </DialogContent>
    </Dialog>
  )
}
export default NewResumeCard
