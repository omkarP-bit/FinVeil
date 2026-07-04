import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  user: { id: string; wallet: string } | null
  login: (user: { id: string; wallet: string }, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  user: null,
  login: (user, token) => {
    localStorage.setItem('access_token', token)
    set({ isAuthenticated: true, user })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    set({ isAuthenticated: false, user: null })
  },
}))
