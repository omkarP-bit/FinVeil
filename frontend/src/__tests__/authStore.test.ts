import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../stores/authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false, user: null })
    localStorage.clear()
  })

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('login sets authenticated state', () => {
    useAuthStore.getState().login(
      { id: 'user-1', wallet: '0xwallet' },
      'test-token'
    )

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual({ id: 'user-1', wallet: '0xwallet' })
    expect(localStorage.getItem('access_token')).toBe('test-token')
  })

  it('logout clears state', () => {
    useAuthStore.getState().login(
      { id: 'user-1', wallet: '0xwallet' },
      'test-token'
    )

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('reads existing token from localStorage', async () => {
    localStorage.setItem('access_token', 'existing-token')
    vi.resetModules()
    const { useAuthStore: freshStore } = await import('../stores/authStore')
    expect(freshStore.getState().isAuthenticated).toBe(true)
  })
})
