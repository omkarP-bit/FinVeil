import { CheckCircle, Shield, Clock } from 'lucide-react'

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
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8 max-w-md mx-auto text-center">
      <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={28} className="text-success" />
      </div>

      <h3 className="text-sm font-medium text-text-muted mb-1">{appName}</h3>

      <div className="space-y-2 my-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          {identityVerified ? (
            <span className="text-success font-medium">✅ Identity Verified</span>
          ) : (
            <span className="text-danger font-medium">❌ Identity Not Verified</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm">
          {ageMet ? (
            <span className="text-success font-medium">✅ Age Requirement Met</span>
          ) : (
            <span className="text-danger font-medium">❌ Age Requirement Not Met</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-text-muted">
        <Clock size={12} />
        Session token expires in {sessionExpiryMinutes} min
      </div>

      <p className="text-xs text-text-muted mt-1">
        No personal documents were shared with this bank.
      </p>

      <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-text-muted">
        <Shield size={12} />
        Verified by FinVeil
      </div>
    </div>
  )
}
