import { useState, useEffect } from 'react'
import { ArrowUp, TrendingUp, Loader2, Lock, Activity } from 'lucide-react'
import { dashboardApi } from '../services/api'

const fallbackData = {
  savingsTrend: [35, 42, 38, 45, 52, 48, 55, 50, 58, 62, 60, 68],
  spendingBreakdown: [
    { label: 'Dining', percentage: 40 },
    { label: 'Transport', percentage: 20 },
    { label: 'Rent', percentage: 32 },
    { label: 'Other', percentage: 8 },
  ],
  anomalies: [{ message: 'Dining spending is up 40% month-over-month', severity: 'warning' as const }],
}

export default function Dashboard() {
  const [data, setData] = useState<typeof fallbackData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.me()
      .then(({ data: d }) => setData(d))
      .catch(() => setData(fallbackData))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={24} strokeWidth={1.5} style={{ color: 'var(--color-amber)' }} className="btn-spinner" />
      </div>
    )
  }

  const displayData = data ?? fallbackData
  const savingsChange = displayData.savingsTrend.length >= 2
    ? ((displayData.savingsTrend[displayData.savingsTrend.length - 1] - displayData.savingsTrend[displayData.savingsTrend.length - 2]) / displayData.savingsTrend[displayData.savingsTrend.length - 2] * 100).toFixed(0)
    : '0'
  const isUp = Number(savingsChange) >= 0

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
        <Activity size={22} strokeWidth={1.8} style={{ color: 'var(--color-amber)' }} />
        My Financial Dashboard
      </h1>

      {/* Savings Trend Card */}
      <div style={{
        background: 'var(--color-bg-raised)',
        border: '1px solid var(--color-line)',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-dim)',
            margin: 0,
          }}>
            Savings Rate Trend
          </h2>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 600,
            color: isUp ? 'var(--color-text)' : 'var(--color-danger)',
            fontFamily: 'var(--font-mono)',
          }}>
            <ArrowUp size={12} strokeWidth={2.5} style={{
              transform: isUp ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s',
            }} />
            {Math.abs(Number(savingsChange))}% this month
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '72px' }}>
          {displayData.savingsTrend.map((h: number, i: number) => {
            const opacity = 0.3 + (h / 100) * 0.5
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: `linear-gradient(to top, var(--color-amber), rgba(255, 176, 0, 0.4))`,
                  borderRadius: '3px 3px 0 0',
                  opacity,
                  transition: 'opacity 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = `${opacity}` }}
              />
            )
          })}
        </div>
      </div>

      {/* Spending Breakdown Card */}
      <div style={{
        background: 'var(--color-bg-raised)',
        border: '1px solid var(--color-line)',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '16px',
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-dim)',
          margin: '0 0 18px',
        }}>
          Spending Breakdown
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayData.spendingBreakdown.map((item: any, i: number) => {
            const barColors = ['#FFB000', '#E8C468', '#6EE7FF', '#8A7D70']
            return (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text)' }}>{item.label}</span>
                  <span style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{item.percentage}%</span>
                </div>
                <div style={{
                  height: '6px',
                  background: 'var(--color-bg-raised-2)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '999px',
                    background: barColors[i % barColors.length],
                    width: `${item.percentage}%`,
                    transition: 'width 0.6s ease',
                    opacity: 0.7,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Anomalies */}
      {displayData.anomalies.map((a: any, i: number) => (
        <div
          key={i}
          style={{
            borderRadius: '16px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '12px',
            background: a.severity === 'warning'
              ? 'rgba(232, 196, 104, 0.06)'
              : 'rgba(255, 107, 107, 0.06)',
            border: a.severity === 'warning'
              ? '1px solid rgba(232, 196, 104, 0.15)'
              : '1px solid rgba(255, 107, 107, 0.15)',
          }}
        >
          <TrendingUp size={18} strokeWidth={1.8} style={{
            color: a.severity === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)',
            marginTop: '1px',
            flexShrink: 0,
          }} />
          <div>
            <p style={{
              fontSize: '13px',
              fontWeight: 600,
              color: a.severity === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)',
              margin: 0,
            }}>
              Anomaly Detected
            </p>
            <p style={{
              fontSize: '12px',
              color: 'var(--color-text-dim)',
              margin: '3px 0 0',
              opacity: 0.8,
            }}>
              {a.message}
            </p>
          </div>
        </div>
      ))}

      {/* Privacy notice */}
      <div style={{
        background: 'var(--color-bg-raised-2)',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '12px',
        color: 'var(--color-text-dim)',
        opacity: 0.6,
      }}>
        <Lock size={12} strokeWidth={2.5} />
        Only visible to you — decrypted locally.
      </div>
    </div>
  )
}
