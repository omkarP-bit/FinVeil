import { CheckCircle, Shield, Lock } from 'lucide-react'

interface DecisionResultProps {
  appName: string
  lensName: string
  tier: string
}

export default function DecisionResult({ appName, lensName, tier }: DecisionResultProps) {
  const isError = tier.startsWith('Error')
  const isDeclined = tier.startsWith('Declined')
  const tierColor = isError
    ? 'var(--color-danger)'
    : isDeclined
      ? 'var(--color-warning)'
      : 'var(--color-amber)'

  return (
    <div style={{
      background: 'var(--color-bg-raised)',
      border: `1px solid ${isError ? 'rgba(255, 107, 107, 0.2)' : 'var(--color-line)'}`,
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
        background: isError
          ? 'rgba(255, 107, 107, 0.1)'
          : 'rgba(255, 176, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        {isError ? (
          <Shield size={24} strokeWidth={2} style={{ color: 'var(--color-danger)' }} />
        ) : (
          <CheckCircle size={24} strokeWidth={2} style={{ color: 'var(--color-amber)' }} />
        )}
      </div>

      <p style={{
        fontSize: '13px',
        color: 'var(--color-text-dim)',
        margin: '0 0 4px',
        fontFamily: 'var(--font-mono)',
      }}>
        {appName}
      </p>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--color-text-heading)',
        margin: '0 0 16px',
      }}>
        {lensName}
      </h2>

      <div style={{
        display: 'inline-block',
        background: isError
          ? 'rgba(255, 107, 107, 0.1)'
          : 'rgba(255, 176, 0, 0.08)',
        border: `1px solid ${isError ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 176, 0, 0.15)'}`,
        borderRadius: '12px',
        padding: '12px 28px',
        marginBottom: '20px',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          fontWeight: 700,
          color: tierColor,
          letterSpacing: '-0.02em',
        }}>
          {tier}
        </span>
      </div>

      <p style={{
        fontSize: '13px',
        color: 'var(--color-text-dim)',
        lineHeight: 1.6,
        margin: 0,
      }}>
        No plaintext financial data was shared with this app.
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '16px',
        fontSize: '11px',
        color: 'var(--color-text-dim)',
        opacity: 0.7,
        fontFamily: 'var(--font-mono)',
      }}>
        <Lock size={11} strokeWidth={2.5} />
        Verified by FinVeil
      </div>
    </div>
  )
}
