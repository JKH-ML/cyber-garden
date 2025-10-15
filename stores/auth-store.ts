import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null
  profile: Profile | null
  setAuth: (user: User | null, profile: Profile | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  setAuth: (user, profile) => set({ user, profile }),
  clearAuth: () => set({ user: null, profile: null }),
}))
