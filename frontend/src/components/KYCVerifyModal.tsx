import { useState } from 'react'
import { X, Shield, Check, AlertTriangle } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-heading flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            Verify Identity?
          </h2>
          <button onClick={onDeny} className="text-text-muted hover:text-text cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-text mb-4">
          <span className="font-medium text-text-heading">{appName}</span> wants to
          confirm your identity for a loan application.
        </p>

        <div className="bg-surface-alt rounded-xl p-4 mb-4 space-y-2">
          <p className="text-sm font-medium text-text-heading">They will receive:</p>
          <div className="flex items-center gap-2 text-sm text-success">
            <Check size={14} />
            Verified: Yes / No
          </div>
          <div className="flex items-center gap-2 text-sm text-success">
            <Check size={14} />
            Age &ge; 18: Yes / No
          </div>
          <p className="text-sm font-medium text-text-heading mt-3">They will NOT receive:</p>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <AlertTriangle size={14} />
            Name, ID number, address
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <label className="text-sm font-medium text-text">Session expires in:</label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white text-text"
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
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
            onClick={() => onVerify(expiry)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer"
          >
            Verify Once
          </button>
        </div>
      </div>
    </div>
  )
}
