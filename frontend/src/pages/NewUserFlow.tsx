import { useNavigate } from 'react-router-dom'
import { Home, CreditCard, Building, BarChart3, ArrowRight } from 'lucide-react'

const options = [
  {
    id: 'rent',
    icon: Home,
    label: 'Rent an apartment',
    desc: 'Show landlords you\'re a reliable tenant without exposing your finances.',
    accent: '#FFB000',
  },
  {
    id: 'bnpl',
    icon: CreditCard,
    label: 'Buy now, pay later',
    desc: 'Get instant affordability checks without sharing your full history.',
    accent: '#FFB000',
  },
  {
    id: 'loan',
    icon: Building,
    label: 'Get a loan',
    desc: 'Prove your creditworthiness to lenders while keeping your data private.',
    accent: '#E8C468',
  },
  {
    id: 'health',
    icon: BarChart3,
    label: 'Check my financial health',
    desc: 'See your personalized credibility score and track it over time.',
    accent: '#FFB000',
  },
]

export default function NewUserFlow() {
  const navigate = useNavigate()

  const handleSelect = (_id: string) => {
    navigate('/build-profile')
  }

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', paddingTop: '32px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(24px, 4vw, 32px)',
        fontWeight: 700,
        color: 'var(--color-text-heading)',
        margin: '0 0 8px',
        letterSpacing: '-0.02em',
      }}>
        Welcome to FinVeil
      </h1>

      <p style={{
        color: 'var(--color-text-dim)',
        marginBottom: '36px',
        fontSize: '15px',
      }}>
        What brings you here today? Pick one to get started.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                borderRadius: '16px',
                border: '1px solid var(--color-line)',
                background: 'var(--color-bg-raised)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 176, 0, 0.2)'
                e.currentTarget.style.background = 'var(--color-bg-raised-2)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 176, 0, 0.03)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-line)'
                e.currentTarget.style.background = 'var(--color-bg-raised)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 176, 0, 0.08)',
                color: opt.accent,
                flexShrink: 0,
              }}>
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  margin: 0,
                }}>
                  {opt.label}
                </p>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--color-text-dim)',
                  margin: '3px 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {opt.desc}
                </p>
              </div>
              <ArrowRight size={16} strokeWidth={1.8} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
            </button>
          )
        })}
      </div>

      <p style={{
        fontSize: '12px',
        color: 'var(--color-text-dim)',
        marginTop: '36px',
        textAlign: 'center',
        opacity: 0.7,
      }}>
        Your profile will be built from the financial features you choose to share — nothing more.
      </p>
    </div>
  )
}
