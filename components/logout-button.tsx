'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from "@/lib/i18n/navigation";
import { LogOut } from 'lucide-react'
import { SidebarMenuButton, SidebarMenuItem } from './ui/sidebar'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
        <LogOut />
        <span>Logout</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
