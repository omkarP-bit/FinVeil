import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Onboarding from '../pages/Onboarding'

vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithOAuth: vi.fn(),
    },
  },
}))

vi.mock('../services/api', () => ({
  authApi: {
    supabaseLogin: vi.fn(),
    refresh: vi.fn(),
  },
}))

describe('Onboarding Page', () => {
  it('renders FinVeil title and subtitle', () => {
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    )
    expect(screen.getByText('FinVeil')).toBeInTheDocument()
    expect(screen.getByText('Your Encrypted Financial Passport')).toBeInTheDocument()
  })

  it('renders Google button', () => {
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    )
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('renders Apple button as disabled', () => {
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    )
    expect(screen.getByText('Continue with Apple (coming soon)')).toBeInTheDocument()
  })

  it('renders privacy notice', () => {
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    )
    expect(screen.getByText(/Your numbers never leave/)).toBeInTheDocument()
  })
})
