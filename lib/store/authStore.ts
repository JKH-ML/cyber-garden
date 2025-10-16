import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types/database';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,

      setUser: (user) => set({ user }),

      setProfile: (profile) => set({ profile }),

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
      },

      initialize: async () => {
        set({ isLoading: true });

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          set({ user: session.user });

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            set({ profile });
          }
        }

        set({ isLoading: false });

        supabase.auth.onAuthStateChange(async (_event, session) => {
          set({ user: session?.user ?? null });

          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              set({ profile });
            }
          } else {
            set({ profile: null });
          }
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile
      }),
    }
  )
);
