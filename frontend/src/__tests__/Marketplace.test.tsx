import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import Marketplace from '../pages/Marketplace'
import { wagmiConfig } from '../lib/wagmi'

vi.mock('../services/api', () => ({
  profileApi: {
    status: vi.fn().mockResolvedValue({ data: { exists: true, lastUpdatedAt: new Date().toISOString() } }),
  },
  lensApi: {
    list: vi.fn().mockResolvedValue({ data: { lenses: [] } }),
    request: vi.fn(),
    grantPermit: vi.fn(),
    score: vi.fn().mockResolvedValue({ data: { decisionLabel: 'Tier A — Approved', probability: 0.85 } }),
  },
  kycApi: {
    submit: vi.fn(),
    verify: vi.fn(),
  },
  verifyApi: {
    privacy: vi.fn(),
  },
  dashboardApi: {
    me: vi.fn(),
    accessLog: vi.fn(),
  },
  appsApi: {
    list: vi.fn(),
  },
}))

const queryClient = new QueryClient()

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

describe('Marketplace Page', () => {
  it('renders all lens options', async () => {
    renderWithProviders(<Marketplace />)

    expect(screen.getByText('Rental-Readiness')).toBeInTheDocument()
    expect(screen.getByText('BNPL Affordability')).toBeInTheDocument()
    expect(screen.getByText('Credit Tier')).toBeInTheDocument()
    expect(screen.getByText('Budgeting Health')).toBeInTheDocument()
  })

  it('renders profile status', async () => {
    renderWithProviders(<Marketplace />)
    expect(await screen.findByText('Profile active')).toBeInTheDocument()
  })

  it('renders dashboard button', () => {
    renderWithProviders(<Marketplace />)
    expect(screen.getByText('📊 Dashboard')).toBeInTheDocument()
  })

  it('renders KYC button', () => {
    renderWithProviders(<Marketplace />)
    expect(screen.getByText('KYC')).toBeInTheDocument()
  })
})
