"use client"
import React from 'react';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
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
              <FormLabel className="after:content-['*'] after:text-destructive">
                Job Name
              </FormLabel>
              <FormControl>
                <Input placeholder="job name" {...field} />
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
                Company
              </FormLabel>
              <FormControl>
                <Input placeholder="company name" {...field} />
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
                Job Description
              </FormLabel>
              <FormControl>
                <Textarea placeholder="job description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

export default JobInformationForm;
