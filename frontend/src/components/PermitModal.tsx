import { useState } from 'react'
import { X, Shield, Check, AlertTriangle, Clock } from 'lucide-react'

interface PermitModalProps {
  open: boolean
  appName: string
  lensName: string
  onDeny: () => void
  onGrant: (expiryHours: number) => void
}

export default function PermitModal({
  open,
  appName,
  lensName,
  onDeny,
  onGrant,
}: PermitModalProps) {
  const [expiry, setExpiry] = useState(24)

  if (!open) return null

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <h2 style={{
            fontSize: '17px',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: 0,
          }}>
            <Shield size={18} strokeWidth={2} style={{ color: 'var(--color-amber)' }} />
            Grant Access?
          </h2>
          <button
            onClick={onDeny}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-dim)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '8px',
              display: 'flex',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-raised)'; e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-dim)' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{
          fontSize: '14px',
          color: 'var(--color-text-dim)',
          marginBottom: '20px',
          lineHeight: 1.5,
        }}>
          <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{appName}</span> wants to see
          your <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{lensName}</span> score.
        </p>

        <div style={{
          background: 'var(--color-bg-raised)',
          borderRadius: '14px',
          padding: '18px',
          marginBottom: '20px',
          border: '1px solid var(--color-line)',
        }}>
          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: '0 0 10px',
          }}>
            They will see:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-amber)' }}>
            <Check size={14} strokeWidth={2.5} />
            Tier result only
          </div>

          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: '16px 0 10px',
          }}>
            They will NOT see:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-dim)' }}>
            <AlertTriangle size={14} strokeWidth={1.8} />
            Income, debt, spending
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <label style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Clock size={14} strokeWidth={1.8} />
            Access expires in:
          </label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(Number(e.target.value))}
            className="select-field"
          >
            <option value={1}>1 hour</option>
            <option value={6}>6 hours</option>
            <option value={24}>24 hours</option>
            <option value={72}>3 days</option>
            <option value={168}>7 days</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onDeny}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Deny
          </button>
          <button
            onClick={() => onGrant(expiry)}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            Grant Once
          </button>
        </div>
      </div>
    </div>
  )
}
