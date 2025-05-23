"use client"
import React from 'react';
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {z} from "zod";
import {Textarea} from "@/components/ui/textarea";
import {UseFormReturn} from "react-hook-form";

export const formSchema = z.object({
  name: z.string().nonempty("Job name must not empty"),
  company: z.string().nonempty("Job company must not empty"),
  description: z.string().nonempty("Job description must not empty"),
})

type JobInformationFormProps = {
  form: UseFormReturn<JobInfoFormType>;
}

export type JobInfoFormType = z.infer<typeof formSchema>

function JobInformationForm({ form }: JobInformationFormProps) {
  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Name</FormLabel>
              <FormControl>
                <Input placeholder="job name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name of your position.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input placeholder="company name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name of your target company.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea placeholder="job description" {...field} />
              </FormControl>
              <FormDescription>
                This is the description of your job.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

export default JobInformationForm;
