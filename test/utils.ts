import { createClient } from "@/lib/supabase/server"

export const loginAsNormalUser = async () => {
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({
    email: "mock_normal@mail.com",
    password: "mock_normal"
  })
}
