import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'

describe('Dashboard Page', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />)
    expect(screen.getByText('My Financial Dashboard')).toBeInTheDocument()
  })

  it('renders savings trend section', () => {
    render(<Dashboard />)
    expect(screen.getByText('Savings Rate Trend')).toBeInTheDocument()
  })

  it('renders spending breakdown', () => {
    render(<Dashboard />)
    expect(screen.getByText('Spending Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Dining')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Rent')).toBeInTheDocument()
  })

  it('renders anomaly alert', () => {
    render(<Dashboard />)
    expect(screen.getByText('Anomaly Detected')).toBeInTheDocument()
    expect(screen.getByText(/Dining spending is up/)).toBeInTheDocument()
  })
})
