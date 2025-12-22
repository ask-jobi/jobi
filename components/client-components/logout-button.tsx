'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import {useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';

export function LogoutButton() {
  const router = useRouter()
  const t = useTranslations()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
        <LogOut />
        <span>{t("logout")}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
