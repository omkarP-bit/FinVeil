import { CheckCircle, Shield } from 'lucide-react'

interface DecisionResultProps {
  appName: string
  lensName: string
  tier: string
}

export default function DecisionResult({ appName, lensName, tier }: DecisionResultProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8 max-w-md mx-auto text-center">
      <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={28} className="text-success" />
      </div>

      <h3 className="text-sm font-medium text-text-muted mb-1">{appName}</h3>
      <h2 className="text-xl font-semibold text-text-heading mb-2">{lensName}</h2>

      <div className="inline-block bg-primary/10 text-primary font-bold text-2xl px-6 py-3 rounded-xl mb-6">
        {tier}
      </div>

      <p className="text-sm text-text-muted leading-relaxed">
        No plaintext financial data was shared with this app.
      </p>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-text-muted">
        <Shield size={12} />
        Verified by FinVeil
      </div>
    </div>
  )
}
