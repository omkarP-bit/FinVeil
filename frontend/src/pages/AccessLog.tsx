import { useState, useEffect } from 'react'
import { Loader2, History, Trash2, Shield } from 'lucide-react'
import { dashboardApi } from '../services/api'

const fallbackPermits = [
  { app: 'GreenLeaf Rentals', lens: 'Rental-Readiness', status: 'used', time: '2 hrs ago' },
  { app: 'PayLater Co.', lens: 'BNPL Affordability', status: 'used', time: '5 days ago' },
  { app: 'TestBank', lens: 'Credit Tier', status: 'active', time: 'Expires in 23h' },
]

interface Permit {
  app: string
  lens: string
  status: string
  time: string
}

export default function AccessLog() {
  const [permits, setPermits] = useState<Permit[]>(fallbackPermits)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.accessLog()
      .then(({ data }) => {
        if (data.permits?.length) setPermits(data.permits)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={24} strokeWidth={1.5} style={{ color: 'var(--color-amber)' }} className="btn-spinner" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(20px, 3vw, 26px)',
        fontWeight: 700,
        color: 'var(--color-text-heading)',
        letterSpacing: '-0.02em',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <History size={22} strokeWidth={1.8} style={{ color: 'var(--color-amber)' }} />
        Access Log
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {permits.map((p, i) => (
          <div
            key={i}
            style={{
              background: 'var(--color-bg-raised)',
              border: '1px solid var(--color-line)',
              borderRadius: '14px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'border-color 0.2s',
              animation: 'slideUp 0.3s ease',
              animationDelay: `${i * 80}ms`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-line-light)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-line)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: p.status === 'active'
                  ? 'rgba(255, 176, 0, 0.08)'
                  : 'var(--color-bg-raised-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Shield size={16} strokeWidth={1.8} style={{
                  color: p.status === 'active' ? 'var(--color-amber)' : 'var(--color-text-dim)',
                }} />
              </div>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  margin: 0,
                }}>
                  {p.app}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--color-text-dim)',
                  margin: '2px 0 0',
                  opacity: 0.7,
                }}>
                  {p.lens}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                {p.status === 'used' ? (
                  <>
                    <div style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: 'var(--color-text-dim)',
                      opacity: 0.4,
                    }} />
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--color-text-dim)',
                      opacity: 0.6,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      Used
                    </span>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: 'var(--color-mint)',
                      boxShadow: '0 0 6px rgba(51, 255, 51, 0.4)',
                    }} />
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      Active
                    </span>
                  </>
                )}
              </div>
              <p style={{
                fontSize: '11px',
                color: 'var(--color-text-dim)',
                margin: '3px 0 0',
                opacity: 0.6,
              }}>
                {p.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {permits.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 0',
          color: 'var(--color-text-dim)',
          fontSize: '14px',
          opacity: 0.6,
        }}>
          No permit activity yet. Apply a lens to get started.
        </div>
      )}

      <button
        className="btn btn-danger"
        style={{ width: '100%', marginTop: '24px', padding: '14px 24px', fontSize: '13px' }}
      >
        <Trash2 size={14} strokeWidth={2} />
        Revoke all active permits
      </button>
    </div>
  )
}
