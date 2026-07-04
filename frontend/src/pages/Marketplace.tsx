import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Home, CreditCard, Building, BarChart3, CheckCircle, Loader2, Play } from 'lucide-react'
import PermitModal from '../components/PermitModal'
import DecisionResult from '../components/DecisionResult'
import KYCVerifyModal from '../components/KYCVerifyModal'
import KYCResult from '../components/KYCResult'
import PrivacyVerification from '../components/PrivacyVerification'
import DemoWalkthrough from '../components/DemoWalkthrough'
import FinancialPassport, { type PassportScoreData } from '../components/FinancialPassport'
import { lensApi, kycApi, profileApi } from '../services/api'
import { useAccount } from 'wagmi'

const lenses = [
  { id: 'rental-readiness', name: 'Rental-Readiness', description: 'For landlords & leasing apps', icon: Home, color: 'bg-blue-50 text-blue-600' },
  { id: 'bnpl-affordability', name: 'BNPL Affordability', description: 'For buy-now-pay-later apps', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'credit-tier', name: 'Credit Tier', description: 'For lenders', icon: Building, color: 'bg-amber-50 text-amber-600' },
  { id: 'budgeting-health', name: 'Budgeting Health', description: 'Personal financial health', icon: BarChart3, color: 'bg-purple-50 text-purple-600' },
]

export default function Marketplace() {
  const navigate = useNavigate()
  const { address } = useAccount()
  const walletAddress = address ?? ''
  const [modalLens, setModalLens] = useState<typeof lenses[0] | null>(null)
  const [decision, setDecision] = useState<{ tier: string; appName: string; lensName: string } | null>(null)
  const [scoring, setScoring] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{ exists: boolean; lastUpdatedAt?: string } | null>(null)

  const [kycModalOpen, setKycModalOpen] = useState(false)
  const [kycResult, setKycResult] = useState<{
    identityVerified: boolean
    ageMet: boolean
    sessionExpiryMinutes: number
    appName: string
  } | null>(null)
  const [kycVerifying, setKycVerifying] = useState(false)

  const [activeScene, setActiveScene] = useState<string | null>(null)
  const [completedScenes, setCompletedScenes] = useState<string[]>([])
  const [activeLensFilter, setActiveLensFilter] = useState<string | null>(null)

  useEffect(() => {
    profileApi.status().then(({ data }) => setProfileStatus(data)).catch(() => {})
  }, [])

  const completeScene = useCallback((sceneId: string) => {
    setCompletedScenes((prev) => (prev.includes(sceneId) ? prev : [...prev, sceneId]))
  }, [])

  const handleRequest = (lens: typeof lenses[0]) => {
    setModalLens(lens)
  }

  const handleGrant = async (expiryHours: number) => {
    if (!modalLens) return
    setScoring(true)
    try {
      await lensApi.grantPermit(modalLens.id, 'demo-app', expiryHours)
      const { data } = await lensApi.score(modalLens.id)
      setDecision({
        tier: data.decisionLabel,
        appName: getAppNameForLens(modalLens.id),
        lensName: modalLens.name,
      })
      if (activeScene && ['rental-readiness', 'bnpl-affordability', 'credit-tier'].includes(modalLens.id)) {
        completeScene(modalLens.id)
        if (modalLens.id === 'credit-tier') {
          setTimeout(() => completeScene('privacy'), 500)
        }
      }
    } catch {
      const fallback = ['Tier A — Approved', 'Tier B — Approved', 'Tier C — Conditional', 'Declined']
      setDecision({
        tier: fallback[Math.floor(Math.random() * fallback.length)],
        appName: getAppNameForLens(modalLens.id),
        lensName: modalLens.name,
      })
    } finally {
      setScoring(false)
      setModalLens(null)
    }
  }

  const getAppNameForLens = (lensId: string) => {
    const map: Record<string, string> = {
      'rental-readiness': 'GreenLeaf Rentals',
      'bnpl-affordability': 'PayLater Co.',
      'credit-tier': 'Northgate Bank',
      'budgeting-health': 'FinVeil Dashboard',
    }
    return map[lensId] || 'Demo App'
  }

  const runDemoScene = (sceneId: string) => {
    if (sceneId === 'privacy') return
    setActiveLensFilter(sceneId)
    setActiveScene(null)
  }

  const handleKycVerify = async (sessionExpiryMinutes: number) => {
    setKycVerifying(true)
    try {
      const { data } = await kycApi.verify(0, 'northgate-bank', sessionExpiryMinutes)
      setKycResult({
        identityVerified: data.identityVerified !== false,
        ageMet: data.ageMet !== false,
        sessionExpiryMinutes,
        appName: 'Northgate Bank',
      })
    } catch {
      setKycResult({
        identityVerified: true,
        ageMet: true,
        sessionExpiryMinutes,
        appName: 'Northgate Bank',
      })
    } finally {
      setKycVerifying(false)
      setKycModalOpen(false)
    }
  }

  const filteredLenses = activeLensFilter
    ? lenses.filter((l) => l.id === activeLensFilter)
    : lenses

  const passportScoreMock: PassportScoreData = {
    // TODO: replace with real model output once teammate's scoring integration is ready
    score: 742,
    tier: 'Tier A',
    isLoading: false,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-success mb-1">
            <CheckCircle size={14} />
            {profileStatus?.exists ? 'Profile active' : 'No profile yet'}
          </div>
          {profileStatus?.lastUpdatedAt && (
            <p className="text-xs text-text-muted">Last updated: {new Date(profileStatus.lastUpdatedAt).toLocaleDateString()}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/build-profile')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-alt text-sm font-medium text-text hover:bg-border transition-colors cursor-pointer"
          >
            <Shield size={14} />
            {profileStatus?.exists ? 'Update' : 'Build Profile'}
          </button>
          <button
            onClick={() => setKycModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-alt text-sm font-medium text-text hover:bg-border transition-colors cursor-pointer"
          >
            <Shield size={14} />
            KYC
          </button>
        </div>
      </div>

      <div className="mb-6">
        <DemoWalkthrough
          activeScene={activeScene}
          onSelectScene={(id) => {
            setActiveScene(activeScene === id ? null : id)
            if (id) runDemoScene(id)
          }}
          completedScenes={completedScenes}
        />
      </div>

      <FinancialPassport walletAddress={walletAddress} passportScore={passportScoreMock} />

      <h2 className="font-semibold text-text-heading mb-4">
        {activeLensFilter ? `Lens: ${lenses.find((l) => l.id === activeLensFilter)?.name}` : 'Apply a lens'}
        {activeLensFilter && (
          <button
            onClick={() => setActiveLensFilter(null)}
            className="ml-2 text-xs text-text-muted hover:text-text underline cursor-pointer"
          >
            Show all
          </button>
        )}
      </h2>

      <div className="grid gap-3">
        {filteredLenses.map((lens) => {
          const Icon = lens.icon
          const isSceneTarget = activeLensFilter === lens.id
          return (
            <button
              key={lens.id}
              onClick={() => handleRequest(lens)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                isSceneTarget
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-white hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lens.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-text-heading">{lens.name}</p>
                <p className="text-xs text-text-muted">{lens.description}</p>
              </div>
              {completedScenes.includes(lens.id) && (
                <CheckCircle size={16} className="text-success" />
              )}
              <span className="text-text-muted text-sm">→</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-3 rounded-xl bg-surface-alt text-sm font-medium text-text hover:bg-border transition-colors cursor-pointer"
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => navigate('/kyc-setup')}
          className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer"
        >
          <Shield size={14} className="inline mr-1.5" />
          KYC Setup
        </button>
        <button
          onClick={() => navigate('/demo-seed')}
          className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer"
        >
          <Play size={14} className="inline mr-1.5" />
          Demo Users
        </button>
        <button
          onClick={() => navigate('/access-log')}
          className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer"
        >
          📋 Access Log
        </button>
      </div>

      {scoring && (
        <div className="mt-8 bg-white rounded-2xl border border-border p-8 max-w-md mx-auto text-center">
          <Loader2 size={28} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-text-muted">Computing score homomorphically...</p>
          <p className="text-xs text-text-muted mt-2">CoFHE is evaluating your encrypted profile — no plaintext exposed</p>
        </div>
      )}

      {decision && !scoring && (
        <div className="mt-8">
          <DecisionResult
            appName={decision.appName}
            lensName={decision.lensName}
            tier={decision.tier}
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setDecision(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer"
            >
              Clear result
            </button>
            {completedScenes.length === 3 && !completedScenes.includes('privacy') && (
              <button
                onClick={() => completeScene('privacy')}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer"
              >
                Verify Privacy →
              </button>
            )}
          </div>
        </div>
      )}

      {kycResult && (
        <div className="mt-8">
          <KYCResult
            appName={kycResult.appName}
            identityVerified={kycResult.identityVerified}
            ageMet={kycResult.ageMet}
            sessionExpiryMinutes={kycResult.sessionExpiryMinutes}
          />
          <button
            onClick={() => setKycResult(null)}
            className="mt-4 w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text hover:bg-surface-alt transition-colors cursor-pointer"
          >
            Clear result
          </button>
        </div>
      )}

      {completedScenes.length >= 3 && (
        <div className="mt-8">
          <PrivacyVerification />
        </div>
      )}

      <KYCVerifyModal
        open={kycModalOpen}
        appName="Northgate Bank"
        onDeny={() => setKycModalOpen(false)}
        onVerify={handleKycVerify}
      />

      {kycVerifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm text-text-muted">Verifying identity...</p>
          </div>
        </div>
      )}

      <PermitModal
        open={!!modalLens && !scoring}
        appName={getAppNameForLens(modalLens?.id ?? '')}
        lensName={modalLens?.name ?? ''}

        onDeny={() => setModalLens(null)}
        onGrant={handleGrant}
      />
    </div>
  )
}
