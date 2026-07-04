import { useState } from 'react'
import { X, Shield, Check, AlertTriangle, Clock } from 'lucide-react'

interface KYCVerifyModalProps {
  open: boolean
  appName: string
  onDeny: () => void
  onVerify: (sessionExpiryMinutes: number) => void
}

export default function KYCVerifyModal({
  open,
  appName,
  onDeny,
  onVerify,
}: KYCVerifyModalProps) {
  const [expiry, setExpiry] = useState(30)

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
            <Shield size={18} strokeWidth={2} style={{ color: 'var(--color-gold)' }} />
            Verify Identity?
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
          <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{appName}</span> wants to
          confirm your identity for a loan application.
        </p>

        <div style={{
          background: 'var(--color-bg-raised)',
          borderRadius: '14px',
          padding: '18px',
          marginBottom: '20px',
          border: '1px solid var(--color-line)',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 10px' }}>
            They will receive:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-gold)' }}>
            <Check size={14} strokeWidth={2.5} />
            Verified: Yes / No
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-gold)', marginTop: '6px' }}>
            <Check size={14} strokeWidth={2.5} />
            Age &ge; 18: Yes / No
          </div>

          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: '16px 0 10px' }}>
            They will NOT receive:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-dim)' }}>
            <AlertTriangle size={14} strokeWidth={1.8} />
            Name, ID number, address
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
            Session expires in:
          </label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(Number(e.target.value))}
            className="select-field"
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
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
            onClick={() => onVerify(expiry)}
            className="btn btn-gold"
            style={{ flex: 1, border: 'none' }}
          >
            Verify Once
          </button>
        </div>
      </div>
    </div>
  )
}
