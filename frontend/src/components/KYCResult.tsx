import { CheckCircle, Clock, XCircle, Lock } from 'lucide-react'

interface KYCResultProps {
  appName: string
  identityVerified: boolean
  ageMet: boolean
  sessionExpiryMinutes: number
}

export default function KYCResult({
  appName,
  identityVerified,
  ageMet,
  sessionExpiryMinutes,
}: KYCResultProps) {
  const allPassed = identityVerified && ageMet

  return (
    <div style={{
      background: 'var(--color-bg-raised)',
      border: `1px solid ${allPassed ? 'rgba(232, 196, 104, 0.2)' : 'rgba(255, 107, 107, 0.2)'}`,
      borderRadius: '20px',
      padding: '36px 28px',
      maxWidth: '440px',
      margin: '0 auto',
      textAlign: 'center',
      animation: 'slideUp 0.4s ease',
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: allPassed
          ? 'rgba(232, 196, 104, 0.1)'
          : 'rgba(255, 107, 107, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        {allPassed ? (
          <CheckCircle size={24} strokeWidth={2} style={{ color: 'var(--color-gold)' }} />
        ) : (
          <XCircle size={24} strokeWidth={2} style={{ color: 'var(--color-danger)' }} />
        )}
      </div>

      <p style={{
        fontSize: '13px',
        color: 'var(--color-text-dim)',
        margin: '0 0 16px',
        fontFamily: 'var(--font-mono)',
      }}>
        {appName}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: identityVerified ? 'var(--color-gold)' : 'var(--color-danger)',
            boxShadow: identityVerified ? '0 0 8px rgba(232, 196, 104, 0.4)' : 'none',
          }} />
          <span style={{ color: identityVerified ? 'var(--color-gold)' : 'var(--color-danger)' }}>
            {identityVerified ? 'Identity Verified' : 'Identity Not Verified'}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: ageMet ? 'var(--color-gold)' : 'var(--color-danger)',
            boxShadow: ageMet ? '0 0 8px rgba(232, 196, 104, 0.4)' : 'none',
          }} />
          <span style={{ color: ageMet ? 'var(--color-gold)' : 'var(--color-danger)' }}>
            {ageMet ? 'Age Requirement Met' : 'Age Requirement Not Met'}
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: '12px',
        color: 'var(--color-text-dim)',
        marginBottom: '4px',
      }}>
        <Clock size={12} strokeWidth={1.8} />
        Session token expires in {sessionExpiryMinutes} min
      </div>

      <p style={{
        fontSize: '12px',
        color: 'var(--color-text-dim)',
        opacity: 0.7,
        margin: 0,
      }}>
        No personal documents were shared with this bank.
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '14px',
        fontSize: '11px',
        color: 'var(--color-text-dim)',
        opacity: 0.6,
        fontFamily: 'var(--font-mono)',
      }}>
        <Lock size={11} strokeWidth={2.5} />
        Verified by FinVeil
      </div>
    </div>
  )
}
