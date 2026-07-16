import { create } from 'zustand'
import { supabase } from '../../lib/supabase'

export const useAuthStore = create((set) => ({
  session: undefined, // undefined = not yet loaded, null = logged out
  error: null,

  init() {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session ?? null })
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session })
    })
  },

  async signIn(email, password) {
    set({ error: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) set({ error: error.message })
  },

  async signOut() {
    await supabase.auth.signOut()
  },
}))
