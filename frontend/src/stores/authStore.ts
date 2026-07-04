import { create } from 'zustand'

export interface AuthUser {
  id: string
  wallet: string
  name?: string
  email?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  login: (user: AuthUser, token: string) => void
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
