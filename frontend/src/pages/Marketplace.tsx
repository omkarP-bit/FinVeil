import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Home, CreditCard, Building, BarChart3, CheckCircle, Loader2,
  Wallet, FileText, Activity, UserCheck, Sparkles, ArrowRight,
} from 'lucide-react'
import PermitModal from '../components/PermitModal'
import DecisionResult from '../components/DecisionResult'
import KYCVerifyModal from '../components/KYCVerifyModal'
import KYCResult from '../components/KYCResult'
import PrivacyVerification from '../components/PrivacyVerification'
import DemoWalkthrough from '../components/DemoWalkthrough'
import FinancialPassport, { type PassportScoreData } from '../components/FinancialPassport'
import { lensApi, kycApi, profileApi } from '../services/api'
import { useAccount } from 'wagmi'

const LENSES = [
  { id: 'rental-readiness', name: 'Rental-Readiness', description: 'For landlords & leasing apps', icon: Home },
  { id: 'bnpl-affordability', name: 'BNPL Affordability', description: 'For buy-now-pay-later apps', icon: CreditCard },
  { id: 'credit-tier', name: 'Credit Tier', description: 'For lenders', icon: Building },
  { id: 'budgeting-health', name: 'Budgeting Health', description: 'Personal financial health', icon: BarChart3 },
]

function getAppNameForLens(lensId: string) {
  const map: Record<string, string> = {
    'rental-readiness': 'GreenLeaf Rentals',
    'bnpl-affordability': 'PayLater Co.',
    'credit-tier': 'Northgate Bank',
    'budgeting-health': 'FinVeil Dashboard',
  }
  return map[lensId] || 'Demo App'
}

export default function Marketplace() {
  const navigate = useNavigate()
  const { address } = useAccount()
  const walletAddress = address ?? ''
  const [modalLens, setModalLens] = useState<typeof LENSES[0] | null>(null)
  const [decision, setDecision] = useState<{ tier: string; appName: string; lensName: string } | null>(null)
  const [scoring, setScoring] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{ exists: boolean; lastUpdatedAt?: string } | null>(null)
  const [passportScore, setPassportScore] = useState<PassportScoreData>({ score: null, tier: null, isLoading: true })

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

  useEffect(() => {
    lensApi.score('budgeting-health')
      .then(({ data }) => {
        const tierLabel = data.decisionLabel as string
        const tier = tierLabel.startsWith('Tier A') ? 'Tier A'
          : tierLabel.startsWith('Tier B') ? 'Tier B'
          : tierLabel.startsWith('Tier C') ? 'Tier C'
          : 'Declined' as const
        setPassportScore({ score: Math.round((data.probability ?? 0) * 1000), tier, isLoading: false })
      })
      .catch(() => setPassportScore({ score: null, tier: null, isLoading: false }))
  }, [])

  const completeScene = useCallback((sceneId: string) => {
    setCompletedScenes((prev) => (prev.includes(sceneId) ? prev : [...prev, sceneId]))
  }, [])

  const handleRequest = (lens: typeof LENSES[0]) => {
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
      setDecision({
        tier: 'Error — could not compute score',
        appName: getAppNameForLens(modalLens.id),
        lensName: modalLens.name,
      })
    } finally {
      setScoring(false)
      setModalLens(null)
    }
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
        identityVerified: false,
        ageMet: false,
        sessionExpiryMinutes,
        appName: 'Northgate Bank',
      })
    } finally {
      setKycVerifying(false)
      setKycModalOpen(false)
    }
  }

  const filteredLenses = activeLensFilter
    ? LENSES.filter((l) => l.id === activeLensFilter)
    : LENSES

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--color-text-dim)',
            marginBottom: '4px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: profileStatus?.exists ? 'var(--color-mint)' : 'var(--color-text-dim)',
              boxShadow: profileStatus?.exists ? '0 0 6px rgba(51, 255, 51, 0.4)' : 'none',
            }} />
            {profileStatus?.exists ? 'Profile active' : 'No profile yet'}
          </div>
          {profileStatus?.lastUpdatedAt && (
            <p style={{
              fontSize: '11px',
              color: 'var(--color-text-dim)',
              margin: 0,
              opacity: 0.7,
            }}>
              Last updated: {new Date(profileStatus.lastUpdatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/build-profile')}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            <FileText size={13} strokeWidth={2} />
            {profileStatus?.exists ? 'Update' : 'Build Profile'}
          </button>
          <button
            onClick={() => setKycModalOpen(true)}
            className="btn btn-ghost"
            style={{ padding: '8px 16px', fontSize: '12px', borderColor: 'rgba(232, 196, 104, 0.2)', color: 'var(--color-gold)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232, 196, 104, 0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <UserCheck size={13} strokeWidth={2} />
            KYC
          </button>
        </div>
      </div>

      {/* Demo walkthrough */}
      <div style={{ marginBottom: '24px' }}>
        <DemoWalkthrough
          activeScene={activeScene}
          onSelectScene={(id) => {
            setActiveScene(activeScene === id ? null : id)
            if (id) runDemoScene(id)
          }}
          completedScenes={completedScenes}
        />
      </div>

      {/* Financial Passport */}
      <FinancialPassport walletAddress={walletAddress} passportScore={passportScore} />

      {/* Lens grid heading */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--color-text-dim)',
          margin: 0,
        }}>
          {activeLensFilter
            ? `Lens: ${LENSES.find((l) => l.id === activeLensFilter)?.name}`
            : 'Apply a lens'}
        </h2>
        {activeLensFilter && (
          <button
            onClick={() => setActiveLensFilter(null)}
            style={{
              fontSize: '12px',
              color: 'var(--color-text-dim)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              opacity: 0.7,
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-dim)' }}
          >
            Show all
          </button>
        )}
      </div>

      {/* Lens cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredLenses.map((lens) => {
          const Icon = lens.icon
          const isSceneTarget = activeLensFilter === lens.id
          return (
            <button
              key={lens.id}
              onClick={() => handleRequest(lens)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 18px',
                borderRadius: '16px',
                border: `1px solid ${isSceneTarget ? 'rgba(255, 176, 0, 0.2)' : 'var(--color-line)'}`,
                background: isSceneTarget ? 'rgba(255, 176, 0, 0.04)' : 'var(--color-bg-raised)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s',
                fontFamily: 'var(--font-body)',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!isSceneTarget) {
                  e.currentTarget.style.borderColor = 'rgba(255, 176, 0, 0.15)'
                  e.currentTarget.style.background = 'var(--color-bg-raised-2)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSceneTarget) {
                  e.currentTarget.style.borderColor = 'var(--color-line)'
                  e.currentTarget.style.background = 'var(--color-bg-raised)'
                }
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isSceneTarget ? 'rgba(255, 176, 0, 0.1)' : 'var(--color-bg-raised-2)',
                color: isSceneTarget ? 'var(--color-amber)' : 'var(--color-text-dim)',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  margin: 0,
                }}>
                  {lens.name}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--color-text-dim)',
                  margin: '2px 0 0',
                  opacity: 0.8,
                }}>
                  {lens.description}
                </p>
              </div>
              {completedScenes.includes(lens.id) && (
                <CheckCircle size={16} strokeWidth={2} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
              )}
              <ArrowRight size={15} strokeWidth={1.8} style={{ color: 'var(--color-text-dim)', flexShrink: 0, opacity: 0.5 }} />
            </button>
          )
        })}
      </div>

      {/* Quick nav */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginTop: '24px',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'var(--color-bg-raised)',
            border: '1px solid var(--color-line)',
            color: 'var(--color-text-dim)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-line-light)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.color = 'var(--color-text-dim)' }}
        >
          <Activity size={15} strokeWidth={1.8} />
          Dashboard
        </button>
        <button
          onClick={() => navigate('/kyc-setup')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'var(--color-bg-raised)',
            border: '1px solid var(--color-line)',
            color: 'var(--color-text-dim)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(232, 196, 104, 0.2)'; e.currentTarget.style.color = 'var(--color-gold)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.color = 'var(--color-text-dim)' }}
        >
          <UserCheck size={15} strokeWidth={1.8} />
          KYC Setup
        </button>
        <button
          onClick={() => navigate('/access-log')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'var(--color-bg-raised)',
            border: '1px solid var(--color-line)',
            color: 'var(--color-text-dim)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'var(--font-body)',
            gridColumn: '1 / -1',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-line-light)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.color = 'var(--color-text-dim)' }}
        >
          <Wallet size={15} strokeWidth={1.8} />
          Access Log
        </button>
      </div>

      {/* Scoring overlay */}
      {scoring && (
        <div style={{
          marginTop: '32px',
          background: 'var(--color-bg-raised)',
          border: '1px solid var(--color-line)',
          borderRadius: '20px',
          padding: '36px',
          maxWidth: '400px',
          margin: '32px auto 0',
          textAlign: 'center',
        }}>
          <Loader2 size={28} strokeWidth={1.5} style={{ color: 'var(--color-amber)', margin: '0 auto 16px' }} className="btn-spinner" />
          <p style={{ fontSize: '14px', color: 'var(--color-text-dim)' }}>Computing score...</p>
        </div>
      )}

      {/* Decision */}
      {decision && !scoring && (
        <div style={{ marginTop: '28px', animation: 'slideUp 0.4s ease' }}>
          <DecisionResult
            appName={decision.appName}
            lensName={decision.lensName}
            tier={decision.tier}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={() => setDecision(null)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Clear result
            </button>
            {completedScenes.length === 3 && !completedScenes.includes('privacy') && (
              <button
                onClick={() => completeScene('privacy')}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <Sparkles size={14} strokeWidth={2.5} />
                Verify Privacy
              </button>
            )}
          </div>
        </div>
      )}

      {/* KYC result */}
      {kycResult && (
        <div style={{ marginTop: '28px', animation: 'slideUp 0.4s ease' }}>
          <KYCResult
            appName={kycResult.appName}
            identityVerified={kycResult.identityVerified}
            ageMet={kycResult.ageMet}
            sessionExpiryMinutes={kycResult.sessionExpiryMinutes}
          />
          <button
            onClick={() => setKycResult(null)}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '12px' }}
          >
            Clear result
          </button>
        </div>
      )}

      {/* Privacy verification */}
      {completedScenes.length >= 3 && (
        <div style={{ marginTop: '24px' }}>
          <PrivacyVerification />
        </div>
      )}

      {/* KYC Verify modal */}
      <KYCVerifyModal
        open={kycModalOpen}
        appName="Northgate Bank"
        onDeny={() => setKycModalOpen(false)}
        onVerify={handleKycVerify}
      />

      {/* KYC verifying overlay */}
      {kycVerifying && (
        <div className="modal-overlay">
          <div style={{
            background: 'var(--color-bg-raised-2)',
            border: '1px solid var(--color-line)',
            borderRadius: '20px',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            <Loader2 size={28} strokeWidth={1.5} style={{ color: 'var(--color-gold)' }} className="btn-spinner" />
            <p style={{ fontSize: '14px', color: 'var(--color-text-dim)' }}>Verifying identity...</p>
          </div>
        </div>
      )}

      {/* Permit modal */}
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
