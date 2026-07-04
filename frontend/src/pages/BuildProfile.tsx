import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, Lock, Loader2 } from 'lucide-react'
import { profileApi } from '../services/api'

function simulateEncryption(value: string | number): [string, string] {
  const h = btoa(String(value)).slice(0, 16).padEnd(16, '0')
  return [`0x0000000000000000000000000000000000000000000000000000${h}`, `0x0000000000000000000000000000000000000000000000000000000000000001`]
}

export default function BuildProfile() {
  const navigate = useNavigate()
  const [income, setIncome] = useState('')
  const [volatility, setVolatility] = useState(50)
  const [debtRatio, setDebtRatio] = useState('')
  const [historyScore, setHistoryScore] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const encryptedFields = {
        income: simulateEncryption(income),
        spendVolatility: simulateEncryption(volatility),
        debtRatio: simulateEncryption(debtRatio),
        txnHistoryScore: simulateEncryption(historyScore),
      }
      await profileApi.submit(encryptedFields)
      navigate('/marketplace')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save profile')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-6 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Build Your FinVeil Profile
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-heading mb-1.5">
            Monthly Income
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="5000"
              className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-heading mb-1.5">
            Spend Volatility
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={volatility}
            onChange={(e) => setVolatility(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Stable</span>
            <span>{volatility}%</span>
            <span>Volatile</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-heading mb-1.5">
            Debt Ratio
          </label>
          <div className="relative">
            <input
              type="number"
              value={debtRatio}
              onChange={(e) => setDebtRatio(e.target.value)}
              placeholder="25"
              className="w-full pr-8 pl-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-heading mb-1.5">
            Transaction History
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setHistoryScore(star)}
                className={`text-2xl cursor-pointer transition-colors ${
                  star <= historyScore ? 'text-warning' : 'text-border'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
          <Lock size={16} className="text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-text-muted leading-relaxed">
            Encrypted on this device before it ever leaves.
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
          {submitting ? 'Encrypting & Saving...' : 'Encrypt & Save'}
        </button>
      </form>
    </div>
  )
}
