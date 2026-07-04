import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AccessLog from '../pages/AccessLog'

vi.mock('../services/api', () => ({
  dashboardApi: {
    accessLog: vi.fn().mockResolvedValue({
      data: {
        permits: [
          { app: 'GreenLeaf Rentals', lens: 'Rental-Readiness', status: 'used', time: '2 hrs ago' },
          { app: 'PayLater Co.', lens: 'BNPL Affordability', status: 'used', time: '5 days ago' },
          { app: 'TestBank', lens: 'Credit Tier', status: 'active', time: 'Expires in 23h' },
        ],
      },
    }),
    me: vi.fn(),
  },
}))

describe('AccessLog Page', () => {
  it('renders access log title', async () => {
    render(<AccessLog />)
    expect(await screen.findByText('Access Log')).toBeInTheDocument()
  })

  it('renders permit entries', async () => {
    render(<AccessLog />)
    expect(await screen.findByText('GreenLeaf Rentals')).toBeInTheDocument()
    expect(await screen.findByText('PayLater Co.')).toBeInTheDocument()
    expect(await screen.findByText('TestBank')).toBeInTheDocument()
  })

  it('renders revoke button', async () => {
    render(<AccessLog />)
    expect(await screen.findByText('Revoke all active permits')).toBeInTheDocument()
  })
})
