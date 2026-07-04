import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Home, CreditCard, Building, BarChart3, Bell, Settings, CheckCircle } from 'lucide-react'
import PermitModal from '../components/PermitModal'
import DecisionResult from '../components/DecisionResult'

const lenses = [
  { id: 'rental-readiness', name: 'Rental-Readiness', description: 'For landlords & leasing apps', icon: Home, color: 'bg-blue-50 text-blue-600' },
  { id: 'bnpl-affordability', name: 'BNPL Affordability', description: 'For buy-now-pay-later apps', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'credit-tier', name: 'Credit Tier', description: 'For lenders', icon: Building, color: 'bg-amber-50 text-amber-600' },
  { id: 'budgeting-health', name: 'Budgeting Health', description: 'Personal financial health', icon: BarChart3, color: 'bg-purple-50 text-purple-600' },
]

export default function Marketplace() {
  const navigate = useNavigate()
  const [modalLens, setModalLens] = useState<typeof lenses[0] | null>(null)
  const [decision, setDecision] = useState<{ tier: string } | null>(null)

  const handleRequest = (lens: typeof lenses[0]) => {
    setModalLens(lens)
  }

  const handleGrant = (_expiryHours: number) => {
    if (!modalLens) return
    const tiers = ['Tier A — Approved', 'Tier B — Approved', 'Tier C — Conditional', 'Declined']
    const tier = tiers[Math.floor(Math.random() * tiers.length)]
    setDecision({ tier })
    setModalLens(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-success mb-1">
            <CheckCircle size={14} />
            Profile active
          </div>
          <p className="text-xs text-text-muted">Last updated: 3 days ago</p>
        </div>
        <button
          onClick={() => navigate('/kyc-setup')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-alt text-sm font-medium text-text hover:bg-border transition-colors cursor-pointer"
        >
          <Shield size={14} />
          KYC
        </button>
      </div>

      <h2 className="font-semibold text-text-heading mb-4">Apply a lens</h2>

      <div className="grid gap-3">
        {lenses.map((lens) => {
          const Icon = lens.icon
          return (
            <button
              key={lens.id}
              onClick={() => handleRequest(lens)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-sm transition-all text-left cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lens.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-text-heading">{lens.name}</p>
                <p className="text-xs text-text-muted">{lens.description}</p>
              </div>
              <span className="text-text-muted text-sm">→</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        className="w-full mt-6 px-4 py-3 rounded-xl bg-surface-alt text-sm font-medium text-text hover:bg-border transition-colors cursor-pointer"
      >
        📊 My Dashboard
      </button>

      {decision && (
        <div className="mt-8">
          <DecisionResult
            appName="Demo App"
            lensName={modalLens?.name ?? 'Lens'}
            tier={decision.tier}
          />
        </div>
      )}

      <PermitModal
        open={!!modalLens}
        appName="Demo App"
        lensName={modalLens?.name ?? ''}
        lensDescription={modalLens?.description ?? ''}
        onDeny={() => setModalLens(null)}
        onGrant={handleGrant}
      />
    </div>
  )
}
