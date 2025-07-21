"use client";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { defineStepper } from "@/components/stepper";
import JobInformationForm, {
  formSchema,
  JobInfoFormType,
} from "@/components/client-components/job-information-form";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ResumeUpload from "@/components/client-components/resume-upload";
import { toast } from "sonner";
import ResumeAnalyzeProgress, {
  ProgressType,
} from "@/components/client-components/resume-analyze-progress";
import {fetchEventSource} from "@microsoft/fetch-event-source";
import { useRouter } from "@/lib/i18n/navigation";

const { Stepper } = defineStepper(
  { id: "step-1", title: "Job Information" },
  { id: "step-2", title: "Select Resume" },
  { id: "step-3", title: "Analyze Resume" }
);

const initialProgress: ProgressType = [0, "Ready to analyze"]

const NewResumeCard = () => {
  const [cardOpen, setCardOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressType>(initialProgress);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File>();
  const [controller, setController] = useState<AbortController | null>(null);
  const form = useForm<JobInfoFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      description: "",
    },
  });

  const router = useRouter();

  const handleOpenDialog = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    setCardOpen(open);
  };

  const handleNext = async (methods: any) => {
    if (methods.current.id === "step-1") {
      const isValid = await form.trigger();
      if (!isValid) {
        return;
      }
    }
    if (methods.current.id === "step-2") {
      if (!resumeFile) {
        toast.warning("Please upload one resume when goto next step.");
        return;
      }
      analyzeResume()
    }
    methods.next();
  };

  const resetForm = () => {
    form.reset()
    setProgress(initialProgress)
    setResumeFile(undefined)
    setIsAnalyzing(false);
  }

  const analyzeResume = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    const newController = new AbortController();
    setController(newController);

    try {
      const formData = new FormData();
      formData.append("file", resumeFile!!);
      formData.append("jobInfo", JSON.stringify(form.getValues()));

      await fetchEventSource("/api/resume/upload-and-analyze", {
        method: "POST",
        body: formData,
        signal: newController.signal,
        onmessage(event) {
          const data = JSON.parse(event.data);
          if (data.error) {
            toast.error(data.error);
            setIsAnalyzing(false);
          }
          setProgress([data.progress, data.message]);

          if (data.progress === 100) {
            setTimeout(() => {
              resetForm()
              setCardOpen(false);
              router.refresh();
            }, 1200);
          }
        },
        onerror(err) {
          setIsAnalyzing(false);
          throw err;
        }
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [controller]);

  return (
    <Dialog open={cardOpen} onOpenChange={handleOpenDialog}>
      <DialogTrigger asChild>
        <Card className="aspect-[1/1.414] border-dashed cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary">
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-lg font-medium text-muted-foreground select-none">
              Create New Resume
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Resume</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <Stepper.Provider className="space-y-4">
          {({ methods }) => (
            <>
              <Stepper.Navigation>
                {methods.all.map((step) => (
                  <Stepper.Step
                    key={step.id}
                    of={step.id}
                    onClick={() => methods.goTo(step.id)}
                  >
                    <Stepper.Title>{step.title}</Stepper.Title>
                  </Stepper.Step>
                ))}
              </Stepper.Navigation>
              {methods.switch({
                "step-1": () => <JobInformationForm form={form} />,
                "step-2": () => (
                  <ResumeUpload
                    file={resumeFile}
                    onSelectFile={setResumeFile}
                  />
                ),
                "step-3": () => <ResumeAnalyzeProgress progress={progress} />,
              })}
              <Stepper.Controls>
                {!methods.isLast && (
                  <Button
                    variant="secondary"
                    onClick={methods.prev}
                    disabled={methods.isFirst}
                  >
                    Previous
                  </Button>
                )}
                {methods.switch({
                  "step-1": () => (
                    <Button onClick={() => handleNext(methods)}>Next</Button>
                  ),
                  "step-2": () => (
                    <Button onClick={() => handleNext(methods)} disabled={!resumeFile || isAnalyzing}>Start Analysis</Button>
                  ),
                })}
              </Stepper.Controls>
            </>
          )}
        </Stepper.Provider>
      </DialogContent>
    </Dialog>
  );
};
export default NewResumeCard;
