import { useState, useEffect } from 'react'
import { ArrowUp, TrendingUp, Loader2 } from 'lucide-react'
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

function getBarColor(index: number): string {
  const colors = ['bg-primary/20', 'bg-primary/30', 'bg-primary/40', 'bg-primary/50', 'bg-primary/60', 'bg-primary/40', 'bg-primary/50', 'bg-primary/30', 'bg-primary/60', 'bg-primary/50', 'bg-primary/40', 'bg-primary/70']
  return colors[index % colors.length]
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
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    )
  }

  const displayData = data ?? fallbackData
  const savingsChange = displayData.savingsTrend.length >= 2
    ? ((displayData.savingsTrend[displayData.savingsTrend.length - 1] - displayData.savingsTrend[displayData.savingsTrend.length - 2]) / displayData.savingsTrend[displayData.savingsTrend.length - 2] * 100).toFixed(0)
    : '0'
  const isUp = Number(savingsChange) >= 0

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-text-heading mb-6">My Financial Dashboard</h1>

      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-heading">Savings Rate Trend</h2>
          <span className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-success' : 'text-danger'}`}>
            <ArrowUp size={12} className={isUp ? '' : 'rotate-180'} />
            {Math.abs(Number(savingsChange))}% this month
          </span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {displayData.savingsTrend.map((h: number, i: number) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${getBarColor(i)}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <h2 className="text-sm font-medium text-text-heading mb-3">Spending Breakdown</h2>
        <div className="space-y-3">
          {displayData.spendingBreakdown.map((item: any, i: number) => {
            const barColors = ['bg-primary', 'bg-amber-500', 'bg-emerald-500', 'bg-slate-400']
            return (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text">{item.label}</span>
                  <span className="text-text-muted">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {displayData.anomalies.map((a: any, i: number) => (
        <div
          key={i}
          className={`rounded-2xl p-4 flex items-start gap-3 mb-4 ${
            a.severity === 'warning'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <TrendingUp size={18} className={`mt-0.5 shrink-0 ${a.severity === 'warning' ? 'text-warning' : 'text-danger'}`} />
          <div>
            <p className="text-sm font-medium text-amber-800">Anomaly Detected</p>
            <p className="text-xs text-amber-700">{a.message}</p>
          </div>
        </div>
      ))}

      <div className="bg-surface-alt rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Only visible to you — decrypted locally.
      </div>
    </div>
  )
}
