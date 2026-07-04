import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PermitModal from '../components/PermitModal'

describe('PermitModal', () => {
  const defaultProps = {
    open: true,
    appName: 'TestApp',
    lensName: 'Rental-Readiness',
    lensDescription: 'For landlords',
    onDeny: vi.fn(),
    onGrant: vi.fn(),
  }

  it('renders when open', () => {
    render(<PermitModal {...defaultProps} />)
    expect(screen.getByText('Grant Access?')).toBeInTheDocument()
    expect(screen.getByText('TestApp')).toBeInTheDocument()
    expect(screen.getByText('Rental-Readiness')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<PermitModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Grant Access?')).not.toBeInTheDocument()
  })

  it('shows what they will/will not see', () => {
    render(<PermitModal {...defaultProps} />)
    expect(screen.getByText('Tier result only')).toBeInTheDocument()
    expect(screen.getByText('Income, debt, spending')).toBeInTheDocument()
  })

  it('calls onDeny when Deny is clicked', () => {
    render(<PermitModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Deny'))
    expect(defaultProps.onDeny).toHaveBeenCalledOnce()
  })

  it('calls onGrant with expiry when Grant is clicked', () => {
    const onGrant = vi.fn()
    render(<PermitModal {...defaultProps} onGrant={onGrant} />)
    fireEvent.click(screen.getByText('Grant Once'))
    expect(onGrant).toHaveBeenCalledWith(24)
  })
})
