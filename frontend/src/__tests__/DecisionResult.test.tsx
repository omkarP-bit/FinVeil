import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DecisionResult from '../components/DecisionResult'

describe('DecisionResult', () => {
  it('renders app name and lens name', () => {
    render(<DecisionResult appName="TestApp" lensName="Rental-Readiness" tier="Tier A" />)
    expect(screen.getByText('TestApp')).toBeInTheDocument()
    expect(screen.getByText('Rental-Readiness')).toBeInTheDocument()
  })

  it('renders the tier', () => {
    render(<DecisionResult appName="TestApp" lensName="Lens" tier="Tier A — Approved" />)
    expect(screen.getByText('Tier A — Approved')).toBeInTheDocument()
  })

  it('renders privacy note', () => {
    render(<DecisionResult appName="TestApp" lensName="Lens" tier="A" />)
    expect(screen.getByText(/No plaintext financial data/)).toBeInTheDocument()
  })
})
