import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BuildProfile from '../pages/BuildProfile'

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('BuildProfile Page', () => {
  it('renders all form fields', () => {
    renderWithRouter(<BuildProfile />)

    expect(screen.getByText('Build Your FinVeil Profile')).toBeInTheDocument()
    expect(screen.getByText('Monthly Income')).toBeInTheDocument()
    expect(screen.getByText('Spend Volatility')).toBeInTheDocument()
    expect(screen.getByText('Debt Ratio')).toBeInTheDocument()
    expect(screen.getByText('Transaction History')).toBeInTheDocument()
  })

  it('renders encryption notice', () => {
    renderWithRouter(<BuildProfile />)
    expect(screen.getByText(/Encrypted on this device/)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderWithRouter(<BuildProfile />)
    expect(screen.getByText('Encrypt & Save')).toBeInTheDocument()
  })
})
