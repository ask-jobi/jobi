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
import {toast} from "sonner";
import ResumeAnalyzeProgress, {ProgressType} from "@/components/client-components/resume-analyze-progress";
import {createResumeRecord, uploadResumeFile} from "@/server/resume";

const {Stepper} = defineStepper(
  {id: "step-1", title: "Job Information"},
  {id: "step-2", title: "Select Resume"},
  {id: "step-3", title: "Analyze Resume"},
);

const NewResumeCard = () => {
  const [cardOpen, setCardOpen] = useState<boolean>(false)
  const [progress, setProgress] = useState<ProgressType>([0, "Ready to analyze"]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    if (!open) {
      // 重置表单和文件状态
      form.reset();
      setResumeFile(undefined);
    }
    setCardOpen(open)
  }

  const handleNext = async (methods: any) => {
    if (methods.current.id === "step-1") {
      const isValid = await form.trigger()
      if (!isValid) {
        return
      }
    }
    if (methods.current.id === "step-2") {
      if (!resumeFile) {
        toast.warning("Please upload one resume when goto next step.")
        return
      }
    }
    methods.next()
  }

  const analyzeResume = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      setProgress([10, "Uploading resume file..."]);
      const uploadResult = await uploadResumeFile(resumeFile!!);

      setProgress([50, "Prepare resume data..."]);
      await createResumeRecord(form.getValues(), uploadResult);

      setProgress([75, "Analyzing resume content..."]);
      // TODO AI generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress([100, "Analysis completed!"]);

    } catch (error: any) {
      toast.error(error.toString());
      setProgress([0, "Analysis failed"]);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        setCardOpen(false)
      }, 500)
    }
  };

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
        className="sm:max-w-[600px]">
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
                "step-2": () => <ResumeUpload file={resumeFile} onSelectFile={setResumeFile}/>,
                "step-3": () => <ResumeAnalyzeProgress
                  progress={progress}
                />
              })}
              <Stepper.Controls>
                {
                  !methods.isLast &&
                  <Button
                    variant="secondary"
                    onClick={methods.prev}
                    disabled={methods.isFirst}
                  >
                    Previous
                  </Button>
                }
                {methods.switch({
                "step-1": () => <Button onClick={() => handleNext(methods)}>Next</Button>,
                "step-2": () => <Button onClick={() => handleNext(methods)}>Next</Button>,
                "step-3": () => <Button
                    onClick={analyzeResume}
                    disabled={!resumeFile || isAnalyzing}
                >
                    Start Analysis
                </Button>
              })}
              </Stepper.Controls>
            </>
          )}
        </Stepper.Provider>
      </DialogContent>
    </Dialog>
  )
}
export default NewResumeCard
