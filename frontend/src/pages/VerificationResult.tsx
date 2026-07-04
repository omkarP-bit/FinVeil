import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, ShieldX, Clock, ArrowLeft, ExternalLink } from 'lucide-react'

interface VerificationState {
  appName?: string
  identityVerified?: boolean
  ageVerified?: boolean
  sessionExpiry?: string
}

export default function VerificationResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as VerificationState) || {}

  const appName = state.appName || 'Northgate Bank'
  const identityVerified = state.identityVerified ?? true
  const ageVerified = state.ageVerified ?? true
  const sessionExpiry = state.sessionExpiry || '30 min'

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-up">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="glow-btn glow-btn-outline flex items-center gap-1.5 !py-1.5 !px-3 !text-xs mb-2"
      >
        <ArrowLeft size={13} />
        Back
      </button>

      {/* Result card */}
      <div className="dh-card p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 pulse-ring">
          <ShieldCheck size={32} className="text-emerald-400" />
        </div>

        <h1 className="text-xl font-bold text-text-primary mb-1">Identity Verified</h1>
        <p className="text-sm text-text-secondary mb-6">{appName}</p>

        <div className="space-y-3 text-left">
          <div className="dh-card-static !bg-white/[0.02] p-3.5 flex items-center justify-between">
            <span className="text-sm text-text-secondary">Identity Match</span>
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${identityVerified ? 'text-emerald-400' : 'text-red-400'}`}>
              {identityVerified ? <ShieldCheck size={15} /> : <ShieldX size={15} />}
              {identityVerified ? 'Verified' : 'Failed'}
            </span>
          </div>

          <div className="dh-card-static !bg-white/[0.02] p-3.5 flex items-center justify-between">
            <span className="text-sm text-text-secondary">Age Requirement</span>
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${ageVerified ? 'text-emerald-400' : 'text-red-400'}`}>
              {ageVerified ? <ShieldCheck size={15} /> : <ShieldX size={15} />}
              {ageVerified ? 'Met' : 'Not Met'}
            </span>
          </div>

          <div className="dh-card-static !bg-white/[0.02] p-3.5 flex items-center justify-between">
            <span className="text-sm text-text-secondary">Session Token</span>
            <span className="text-sm font-mono text-accent-400 flex items-center gap-1.5">
              <Clock size={13} />
              {sessionExpiry}
            </span>
          </div>
        </div>

        <div className="dh-divider my-5" />

        <div className="dh-card-static !bg-amber-500/5 border-amber-500/20 p-3.5">
          <p className="text-xs text-text-secondary leading-relaxed">
            <ExternalLink size={12} className="inline mr-1 text-amber-400" />
            No personal documents (name, ID number, address) were shared with{' '}
            <span className="text-text-primary font-medium">{appName}</span>.
            Only the verification result was disclosed via a session-scoped token.
          </p>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => navigate('/marketplace')}
        className="glow-btn w-full !py-3"
      >
        Return to Marketplace
      </button>
    </div>
  )
}
