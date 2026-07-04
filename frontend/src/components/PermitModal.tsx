import { useState } from 'react'
import { X, Shield, Check, AlertTriangle } from 'lucide-react'

interface PermitModalProps {
  open: boolean
  appName: string
  lensName: string
  lensDescription: string
  onDeny: () => void
  onGrant: (expiryHours: number) => void
}

export default function PermitModal({
  open,
  appName,
  lensName,
  lensDescription,
  onDeny,
  onGrant,
}: PermitModalProps) {
  const [expiry, setExpiry] = useState(24)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-heading flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            Grant Access?
          </h2>
          <button onClick={onDeny} className="text-text-muted hover:text-text cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-text mb-4">
          <span className="font-medium text-text-heading">{appName}</span> wants to see
          your <span className="font-medium text-text-heading">{lensName}</span> score.
        </p>

        <div className="bg-surface-alt rounded-xl p-4 mb-4 space-y-2">
          <p className="text-sm font-medium text-text-heading">They will see:</p>
          <div className="flex items-center gap-2 text-sm text-success">
            <Check size={14} />
            Tier result only
          </div>
          <p className="text-sm font-medium text-text-heading mt-3">They will NOT see:</p>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <AlertTriangle size={14} />
            Income, debt, spending
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <label className="text-sm font-medium text-text">Access expires in:</label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white text-text"
          >
            <option value={1}>1 hour</option>
            <option value={6}>6 hours</option>
            <option value={24}>24 hours</option>
            <option value={72}>3 days</option>
            <option value={168}>7 days</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer"
          >
            Deny
          </button>
          <button
            onClick={() => onGrant(expiry)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer"
          >
            Grant Once
          </button>
        </div>
      </div>
    </div>
  )
}
