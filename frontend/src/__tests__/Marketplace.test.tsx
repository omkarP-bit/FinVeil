import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Marketplace from '../pages/Marketplace'

vi.mock('../services/api', () => ({
  profileApi: {
    status: vi.fn().mockResolvedValue({ data: { exists: true, lastUpdatedAt: new Date().toISOString() } }),
  },
  lensApi: {
    list: vi.fn().mockResolvedValue({ data: { lenses: [] } }),
    request: vi.fn(),
    grantPermit: vi.fn(),
    score: vi.fn(),
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

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Marketplace Page', () => {
  it('renders all lens options', async () => {
    renderWithRouter(<Marketplace />)

    expect(screen.getByText('Rental-Readiness')).toBeInTheDocument()
    expect(screen.getByText('BNPL Affordability')).toBeInTheDocument()
    expect(screen.getByText('Credit Tier')).toBeInTheDocument()
    expect(screen.getByText('Budgeting Health')).toBeInTheDocument()
  })

  it('renders profile status', async () => {
    renderWithRouter(<Marketplace />)
    expect(await screen.findByText('Profile active')).toBeInTheDocument()
  })

  it('renders dashboard button', () => {
    renderWithRouter(<Marketplace />)
    expect(screen.getByText('📊 Dashboard')).toBeInTheDocument()
  })

  it('renders KYC button', () => {
    renderWithRouter(<Marketplace />)
    expect(screen.getByText('KYC')).toBeInTheDocument()
  })
})
