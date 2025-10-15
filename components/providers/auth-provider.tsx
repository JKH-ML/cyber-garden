"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch user profile
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            setAuth(session.user, profile)
          })
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        setAuth(session.user, profile)
        router.refresh()
      } else if (event === "SIGNED_OUT") {
        setAuth(null, null)
        router.refresh()
      } else if (event === "USER_UPDATED" && session?.user) {
        // Refresh profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        setAuth(session.user, profile)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setAuth, router])

  return <>{children}</>
}
