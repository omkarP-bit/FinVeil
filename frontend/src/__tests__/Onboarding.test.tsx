import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Onboarding from '../pages/Onboarding'

vi.mock('../services/api', () => ({
  authApi: {
    oauthCallback: vi.fn().mockResolvedValue({
      data: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        user: { id: 'user-1', wallet: '0xwallet' },
      },
    }),
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

  it('renders OAuth buttons', () => {
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    )
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument()
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
