import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Onboarding from '../pages/Onboarding'

describe('Onboarding Page', () => {
  it('renders FinVeil title and subtitle', () => {
    render(<Onboarding />)
    expect(screen.getByText('FinVeil')).toBeInTheDocument()
    expect(screen.getByText('Your Encrypted Financial Passport')).toBeInTheDocument()
  })

  it('renders OAuth buttons', () => {
    render(<Onboarding />)
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument()
  })

  it('renders privacy notice', () => {
    render(<Onboarding />)
    expect(screen.getByText(/Your numbers never leave/)).toBeInTheDocument()
  })
})
