import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { profileApi } from '../services/api'

export default function BuildProfile() {
  const navigate = useNavigate()
  const [duration, setDuration] = useState('12')
  const [checkNeg, setCheckNeg] = useState(false)
  const [checkNone, setCheckNone] = useState(false)
  const [checkHigh, setCheckHigh] = useState(true)
  const [creditPaid, setCreditPaid] = useState(true)
  const [creditNone, setCreditNone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await profileApi.submit({
        duration: Number(duration),
        checkNeg: checkNeg ? 1 : 0,
        checkNone: checkNone ? 1 : 0,
        checkHigh: checkHigh ? 1 : 0,
        creditPaid: creditPaid ? 1 : 0,
        creditNone: creditNone ? 1 : 0,
      })
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
            Loan Duration (months)
          </label>
          <input
            type="number"
            min={1}
            max={72}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="12"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Checking Account Status
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={checkNeg} onChange={(e) => { setCheckNeg(e.target.checked); setCheckNone(false); setCheckHigh(false); }} />
              Negative balance (&lt; 0 DM)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={checkNone} onChange={(e) => { setCheckNone(e.target.checked); setCheckNeg(false); setCheckHigh(false); }} />
              No checking account
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={checkHigh} onChange={(e) => { setCheckHigh(e.target.checked); setCheckNeg(false); setCheckNone(false); }} />
              High balance (&ge; 200 DM)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Credit History
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={creditPaid} onChange={(e) => { setCreditPaid(e.target.checked); setCreditNone(false); }} />
              Existing credits paid back
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={creditNone} onChange={(e) => { setCreditNone(e.target.checked); setCreditPaid(false); }} />
              No credits taken
            </label>
          </div>
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
          {submitting ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
