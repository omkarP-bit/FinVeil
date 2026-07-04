import { useNavigate } from 'react-router-dom'
import { Home, CreditCard, Building, BarChart3, ArrowRight } from 'lucide-react'

const options = [
  {
    id: 'rent',
    icon: Home,
    label: 'Rent an apartment',
    desc: 'Show landlords you\'re a reliable tenant without exposing your finances.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'bnpl',
    icon: CreditCard,
    label: 'Buy now, pay later',
    desc: 'Get instant affordability checks without sharing your full history.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    id: 'loan',
    icon: Building,
    label: 'Get a loan',
    desc: 'Prove your creditworthiness to lenders while keeping your data private.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'health',
    icon: BarChart3,
    label: 'Check my financial health',
    desc: 'See your personalized credibility score and track it over time.',
    color: 'bg-purple-50 text-purple-600',
  },
]

export default function NewUserFlow() {
  const navigate = useNavigate()

  const handleSelect = (_id: string) => {
    navigate('/build-profile')
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold text-text-heading mb-2">Welcome to FinVeil</h1>
      <p className="text-text-muted mb-8">
        What brings you here today? Pick one to get started.
      </p>

      <div className="space-y-3">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-sm transition-all text-left cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-text-heading">{opt.label}</p>
                <p className="text-xs text-text-muted truncate">{opt.desc}</p>
              </div>
              <ArrowRight size={16} className="text-text-muted shrink-0" />
            </button>
          )
        })}
      </div>

      <p className="text-xs text-text-muted mt-8 text-center">
        Your profile will be built from the financial features you choose to share — nothing more.
      </p>
    </div>
  )
}
