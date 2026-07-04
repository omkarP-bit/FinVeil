import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Marketplace from '../pages/Marketplace'

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('Marketplace Page', () => {
  it('renders all lens options', () => {
    renderWithRouter(<Marketplace />)

    expect(screen.getByText('Rental-Readiness')).toBeInTheDocument()
    expect(screen.getByText('BNPL Affordability')).toBeInTheDocument()
    expect(screen.getByText('Credit Tier')).toBeInTheDocument()
    expect(screen.getByText('Budgeting Health')).toBeInTheDocument()
  })

  it('renders profile status', () => {
    renderWithRouter(<Marketplace />)
    expect(screen.getByText('Profile active')).toBeInTheDocument()
  })

  it('renders dashboard button', () => {
    renderWithRouter(<Marketplace />)
    expect(screen.getByText('📊 My Dashboard')).toBeInTheDocument()
  })

  it('renders KYC button', () => {
    renderWithRouter(<Marketplace />)
    expect(screen.getByText('KYC')).toBeInTheDocument()
  })
})
