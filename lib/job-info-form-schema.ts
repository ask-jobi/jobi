import { z } from "zod"

export const jobInfoFormSchema = z.object({
  name: z.string().nonempty(),
  company: z.string().nonempty(),
  description: z.string().nonempty()
})

export type JobInfoFormType = z.infer<typeof jobInfoFormSchema>
