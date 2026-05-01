import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  error: null,

  initAuth: () => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('accessToken')
    if (storedUser && storedToken) {
      try {
        set({ user: JSON.parse(storedUser) })
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      }
    }
  },

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    set({ user: null })
  },
}))
