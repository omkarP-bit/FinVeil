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
    expect(screen.getByText('Loan Duration (months)')).toBeInTheDocument()
    expect(screen.getByText('Checking Account Status')).toBeInTheDocument()
    expect(screen.getByText('Credit History')).toBeInTheDocument()
  })

  it('renders save button', () => {
    renderWithRouter(<BuildProfile />)
    expect(screen.getByText('Save Profile')).toBeInTheDocument()
  })
})
