import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AccessLog from '../pages/AccessLog'

describe('AccessLog Page', () => {
  it('renders access log title', () => {
    render(<AccessLog />)
    expect(screen.getByText('Access Log')).toBeInTheDocument()
  })

  it('renders permit entries', () => {
    render(<AccessLog />)
    expect(screen.getByText('GreenLeaf Rentals')).toBeInTheDocument()
    expect(screen.getByText('PayLater Co.')).toBeInTheDocument()
    expect(screen.getByText('TestBank')).toBeInTheDocument()
  })

  it('renders revoke button', () => {
    render(<AccessLog />)
    expect(screen.getByText('Revoke all active permits')).toBeInTheDocument()
  })
})
