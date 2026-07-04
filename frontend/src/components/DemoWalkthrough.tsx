import { useState } from 'react'
import { Play, ChevronRight, CheckCircle, Home, CreditCard, Building, Search } from 'lucide-react'

const SCENES = [
  {
    id: 'rental',
    title: 'Scene 1: Rental-Readiness',
    desc: 'Alice wants to rent an apartment. GreenLeaf Rentals requests her Rental-Readiness score.',
    lensId: 'rental-readiness',
    appName: 'GreenLeaf Rentals',
    icon: Home,
    color: 'bg-blue-50 text-blue-600',
    expectedOutcome: 'Alice\'s high income and low debt → Tier A — Approved',
  },
  {
    id: 'bnpl',
    title: 'Scene 2: BNPL Affordability',
    desc: 'Bob wants to use BNPL for a purchase. PayLater Co. checks his affordability.',
    lensId: 'bnpl-affordability',
    appName: 'PayLater Co.',
    icon: CreditCard,
    color: 'bg-emerald-50 text-emerald-600',
    expectedOutcome: 'Bob\'s moderate profile → Tier B — Approved',
  },
  {
    id: 'credit',
    title: 'Scene 3: Credit Tier',
    desc: 'Charlie applies for a loan. Northgate Bank evaluates his credit tier.',
    lensId: 'credit-tier',
    appName: 'Northgate Bank',
    icon: Building,
    color: 'bg-amber-50 text-amber-600',
    expectedOutcome: 'Charlie\'s high risk profile → Declined',
  },
  {
    id: 'privacy',
    title: 'Scene 4: Privacy Verification',
    desc: 'The block explorer shows no plaintext. Only decisions were revealed — never the data.',
    lensId: null,
    appName: null,
    icon: Search,
    color: 'bg-purple-50 text-purple-600',
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
    <div className="bg-white rounded-2xl border-2 border-primary/20 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Play size={16} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-text-heading">
              {allComplete ? 'Demo Complete!' : 'Demo Walkthrough'}
            </p>
            <p className="text-xs text-text-muted">
              {allComplete
                ? 'All 4 scenes completed. Privacy is preserved end-to-end.'
                : `${completedScenes.length}/${SCENES.length} scenes completed`}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className={`text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border p-3 space-y-2">
          {SCENES.map((scene) => {
            const Icon = scene.icon
            const isActive = activeScene === scene.id
            const isCompleted = completedScenes.includes(scene.id)

            return (
              <button
                key={scene.id}
                onClick={() => onSelectScene(isActive ? null : scene.id)}
                disabled={scene.id === 'privacy' && !allComplete}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 border border-primary/30'
                    : isCompleted
                      ? 'bg-success/5 border border-success/20'
                      : 'bg-surface-alt/50 border border-transparent hover:bg-surface-alt'
                } ${scene.id === 'privacy' && !allComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${scene.color}`}>
                  {isCompleted ? <CheckCircle size={16} className="text-success" /> : <Icon size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-text-heading'}`}>
                    {scene.title}
                  </p>
                  <p className="text-[10px] text-text-muted truncate">{scene.expectedOutcome}</p>
                </div>
                {isCompleted && <CheckCircle size={14} className="text-success shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { SCENES }
