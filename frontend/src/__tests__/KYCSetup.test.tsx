import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import KYCSetup from '../pages/KYCSetup'

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('KYCSetup Page', () => {
  it('renders KYC form title', () => {
    renderWithRouter(<KYCSetup />)
    expect(screen.getByText('Verify Your Identity (once)')).toBeInTheDocument()
  })

  it('renders all form fields', () => {
    renderWithRouter(<KYCSetup />)
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Date of Birth')).toBeInTheDocument()
    expect(screen.getByText('Government ID #')).toBeInTheDocument()
    expect(screen.getByText('Address')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderWithRouter(<KYCSetup />)
    expect(screen.getByText('Submit KYC')).toBeInTheDocument()
  })
})
