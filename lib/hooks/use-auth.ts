"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { identifyUser } from "@/lib/user-tracking/user-tracking"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const getUser = useCallback(async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      setUser(user)
      // 如果用户已登录，进行身份识别
      if (user) {
        identifyUser(user.id, user.email || undefined)
      }
    } catch (error) {
      console.error("Error getting user:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  useEffect(() => {
    // 获取当前用户
    getUser()

    // 监听认证状态变化
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setLoading(false)

      // 当用户登录时，进行身份识别
      if (event === "SIGNED_IN" && currentUser) {
        identifyUser(currentUser.id, currentUser.email || undefined)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, getUser])

  return { user, loading }
}
