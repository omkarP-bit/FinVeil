import { useState } from 'react'
import { Play, ChevronDown, CheckCircle, Home, CreditCard, Building, Search, Sparkles } from 'lucide-react'

const SCENES = [
  {
    id: 'rental',
    title: 'Scene 1: Rental-Readiness',
    desc: 'Alice wants to rent an apartment. GreenLeaf Rentals requests her Rental-Readiness score.',
    lensId: 'rental-readiness',
    appName: 'GreenLeaf Rentals',
    icon: Home,
    expectedOutcome: 'Alice\'s strong financial profile → Tier A — Approved',
  },
  {
    id: 'bnpl',
    title: 'Scene 2: BNPL Affordability',
    desc: 'Bob wants to use BNPL for a purchase. PayLater Co. checks his affordability.',
    lensId: 'bnpl-affordability',
    appName: 'PayLater Co.',
    icon: CreditCard,
    expectedOutcome: 'Bob\'s moderate profile → Tier B — Approved',
  },
  {
    id: 'credit',
    title: 'Scene 3: Credit Tier',
    desc: 'Charlie applies for a loan. Northgate Bank evaluates his credit tier.',
    lensId: 'credit-tier',
    appName: 'Northgate Bank',
    icon: Building,
    expectedOutcome: 'Charlie\'s high risk profile → Declined',
  },
  {
    id: 'privacy',
    title: 'Scene 4: Privacy Verification',
    desc: 'The block explorer shows no plaintext. Only decisions were revealed — never the data.',
    lensId: null,
    appName: null,
    icon: Search,
    expectedOutcome: 'All privacy checks pass. Zero plaintext financial data on-chain.',
  },
]

interface DemoWalkthroughProps {
  activeScene: string | null
  onSelectScene: (sceneId: string | null) => void
  completedScenes: string[]
}

export default function DemoWalkthrough({ activeScene, onSelectScene, completedScenes }: DemoWalkthroughProps) {
  const [expanded, setExpanded] = useState(false)

  const allComplete = completedScenes.length === SCENES.length

  return (
    <div style={{
      background: 'var(--color-bg-raised)',
      border: '1px solid var(--color-line)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: allComplete ? 'rgba(255, 176, 0, 0.04)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text)',
          transition: 'background 0.2s',
          fontFamily: 'var(--font-body)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 176, 0, 0.06)' }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = allComplete ? 'rgba(255, 176, 0, 0.04)' : 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: allComplete ? 'rgba(255, 176, 0, 0.1)' : 'var(--color-bg-raised-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: allComplete ? 'var(--color-amber)' : 'var(--color-text-dim)',
          }}>
            {allComplete ? <Sparkles size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-heading)',
              margin: 0,
            }}>
              {allComplete ? 'Demo Complete!' : 'Demo Walkthrough'}
            </p>
            <p style={{
              fontSize: '12px',
              color: 'var(--color-text-dim)',
              margin: '2px 0 0',
            }}>
              {allComplete
                ? 'All 4 scenes completed. Privacy is preserved end-to-end.'
                : `${completedScenes.length}/${SCENES.length} scenes completed`}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          strokeWidth={1.8}
          style={{
            color: 'var(--color-text-dim)',
            transition: 'transform 0.25s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {expanded && (
        <div style={{
          borderTop: '1px solid var(--color-line)',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          animation: 'slideDown 0.25s ease',
        }}>
          {SCENES.map((scene) => {
            const Icon = scene.icon
            const isActive = activeScene === scene.id
            const isCompleted = completedScenes.includes(scene.id)
            const isDisabled = scene.id === 'privacy' && !allComplete

            return (
              <button
                key={scene.id}
                onClick={() => onSelectScene(isActive ? null : scene.id)}
                disabled={isDisabled}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                  border: isActive
                    ? '1px solid var(--color-amber-dim)'
                    : isCompleted
                      ? '1px solid var(--color-line-light)'
                      : '1px solid transparent',
                  background: isActive
                    ? 'rgba(255, 176, 0, 0.06)'
                    : isCompleted
                      ? 'var(--color-bg-raised-2)'
                      : 'transparent',
                  opacity: isDisabled ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isDisabled) {
                    e.currentTarget.style.background = 'var(--color-bg-raised-2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isCompleted
                      ? 'var(--color-bg-raised-2)'
                      : 'transparent'
                  }
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: isCompleted
                    ? 'rgba(255, 176, 0, 0.1)'
                    : 'var(--color-bg-raised-2)',
                }}>
                  {isCompleted ? (
                    <CheckCircle size={14} strokeWidth={2.5} style={{ color: 'var(--color-amber)' }} />
                  ) : (
                    <Icon size={14} strokeWidth={1.8} style={{ color: isActive ? 'var(--color-amber)' : 'var(--color-text-dim)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: isActive
                      ? 'var(--color-amber)'
                      : isCompleted
                        ? 'var(--color-text)'
                        : 'var(--color-text-dim)',
                    margin: 0,
                  }}>
                    {scene.title}
                  </p>
                  <p style={{
                    fontSize: '10px',
                    color: 'var(--color-text-dim)',
                    margin: '2px 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    opacity: 0.7,
                  }}>
                    {scene.expectedOutcome}
                  </p>
                </div>
                {isCompleted && (
                  <CheckCircle size={13} strokeWidth={2.5} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { SCENES }
