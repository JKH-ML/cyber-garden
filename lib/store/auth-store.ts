import { create } from 'zustand';
import { UserProfile, getCurrentUser, signOut as authSignOut } from '../auth';
import { supabase } from '../supabase';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    set({ loading: true });
    const user = await getCurrentUser();
    set({ user, loading: false, initialized: true });

    // 인증 상태 변경 리스너 설정
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getCurrentUser();
        set({ user: profile });
      } else if (event === 'SIGNED_OUT') {
        set({ user: null });
      }
    });
  },

  signOut: async () => {
    await authSignOut();
    set({ user: null });
  },
}));
