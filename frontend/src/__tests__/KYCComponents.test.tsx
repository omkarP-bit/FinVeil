import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import KYCVerifyModal from '../components/KYCVerifyModal'
import KYCResult from '../components/KYCResult'

describe('KYCVerifyModal', () => {
  const defaultProps = {
    open: true,
    appName: 'Northgate Bank',
    onDeny: vi.fn(),
    onVerify: vi.fn(),
  }

  it('renders when open', () => {
    render(<KYCVerifyModal {...defaultProps} />)
    expect(screen.getByText('Verify Identity?')).toBeInTheDocument()
    expect(screen.getByText('Northgate Bank')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<KYCVerifyModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Verify Identity?')).not.toBeInTheDocument()
  })

  it('calls onVerify with expiry when Verify Once is clicked', () => {
    const onVerify = vi.fn()
    render(<KYCVerifyModal {...defaultProps} onVerify={onVerify} />)
    fireEvent.click(screen.getByText('Verify Once'))
    expect(onVerify).toHaveBeenCalledWith(30)
  })

  it('calls onDeny when Deny is clicked', () => {
    render(<KYCVerifyModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Deny'))
    expect(defaultProps.onDeny).toHaveBeenCalledOnce()
  })
})

describe('KYCResult', () => {
  it('renders verified state', () => {
    render(
      <KYCResult
        appName="Northgate Bank"
        identityVerified={true}
        ageMet={true}
        sessionExpiryMinutes={30}
      />
    )
    expect(screen.getByText('Identity Verified')).toBeInTheDocument()
    expect(screen.getByText('Age Requirement Met')).toBeInTheDocument()
  })

  it('renders unverified state', () => {
    render(
      <KYCResult
        appName="Northgate Bank"
        identityVerified={false}
        ageMet={false}
        sessionExpiryMinutes={30}
      />
    )
    expect(screen.getByText('Identity Not Verified')).toBeInTheDocument()
    expect(screen.getByText('Age Requirement Not Met')).toBeInTheDocument()
  })

  it('shows session expiry', () => {
    render(
      <KYCResult
        appName="Northgate Bank"
        identityVerified={true}
        ageMet={true}
        sessionExpiryMinutes={15}
      />
    )
    expect(screen.getByText(/Session token expires in 15 min/)).toBeInTheDocument()
  })
})
