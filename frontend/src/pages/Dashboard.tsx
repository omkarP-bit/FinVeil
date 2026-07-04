import { ArrowUp, TrendingUp } from 'lucide-react'

const spendingData = [
  { label: 'Dining', percentage: 40, color: 'bg-primary' },
  { label: 'Transport', percentage: 20, color: 'bg-amber-500' },
  { label: 'Rent', percentage: 32, color: 'bg-emerald-500' },
  { label: 'Other', percentage: 8, color: 'bg-slate-400' },
]

export default function Dashboard() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-text-heading mb-6">My Financial Dashboard</h1>

      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-heading">Savings Rate Trend</h2>
          <span className="flex items-center gap-1 text-xs text-success font-medium">
            <ArrowUp size={12} />
            12% this month
          </span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {[35, 42, 38, 45, 52, 48, 55, 50, 58, 62, 60, 68].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/20 rounded-t-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <h2 className="text-sm font-medium text-text-heading mb-3">Spending Breakdown</h2>
        <div className="space-y-3">
          {spendingData.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text">{item.label}</span>
                <span className="text-text-muted">{item.percentage}%</span>
              </div>
              <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <TrendingUp size={18} className="text-warning mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Anomaly Detected</p>
          <p className="text-xs text-amber-700">Dining spending is up 40% month-over-month</p>
        </div>
      </div>

      <div className="mt-4 bg-surface-alt rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Only visible to you — decrypted locally.
      </div>
    </div>
  )
}
