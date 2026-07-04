import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'

vi.mock('../services/api', () => ({
  dashboardApi: {
    me: vi.fn().mockResolvedValue({
      data: {
        savingsTrend: [35, 42, 38, 45, 52, 48, 55, 50, 58, 62, 60, 68],
        spendingBreakdown: [
          { label: 'Dining', percentage: 40 },
          { label: 'Transport', percentage: 20 },
          { label: 'Rent', percentage: 32 },
          { label: 'Other', percentage: 8 },
        ],
        anomalies: [{ message: 'Dining spending is up 40% month-over-month', severity: 'warning' }],
      },
    }),
    accessLog: vi.fn(),
  },
}))

describe('Dashboard Page', () => {
  it('renders dashboard title', async () => {
    render(<Dashboard />)
    expect(await screen.findByText('My Financial Dashboard')).toBeInTheDocument()
  })

  it('renders savings trend section', async () => {
    render(<Dashboard />)
    expect(await screen.findByText('Savings Rate Trend')).toBeInTheDocument()
  })

  it('renders spending breakdown', async () => {
    render(<Dashboard />)
    expect(await screen.findByText('Spending Breakdown')).toBeInTheDocument()
    expect(await screen.findByText('Dining')).toBeInTheDocument()
    expect(await screen.findByText('Transport')).toBeInTheDocument()
    expect(await screen.findByText('Rent')).toBeInTheDocument()
  })

  it('renders anomaly alert', async () => {
    render(<Dashboard />)
    expect(await screen.findByText('Anomaly Detected')).toBeInTheDocument()
    expect(await screen.findByText(/Dining spending is up/)).toBeInTheDocument()
  })
})
