'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize)
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialize, initialized])

  return <>{children}</>
}
