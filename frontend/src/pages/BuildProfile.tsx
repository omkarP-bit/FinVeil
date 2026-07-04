import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { profileApi } from '../services/api'
import { useCofhejs } from '../hooks/useCofhejs'

export default function BuildProfile() {
  const navigate = useNavigate()
  const { encryptFields } = useCofhejs()
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
      const plainValues = {
        duration: Number(duration),
        checkNeg: checkNeg ? 1 : 0,
        checkNone: checkNone ? 1 : 0,
        checkHigh: checkHigh ? 1 : 0,
        creditPaid: creditPaid ? 1 : 0,
        creditNone: creditNone ? 1 : 0,
      }

      const encrypted = await encryptFields(Object.values(plainValues))

      if (encrypted) {
        const [duration, checkNeg, checkNone, checkHigh, creditPaid, creditNone] = encrypted
        await profileApi.submitEncrypted({ duration, checkNeg, checkNone, checkHigh, creditPaid, creditNone })
      } else {
        await profileApi.submit(plainValues)
      }

      navigate('/marketplace')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save profile')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--color-text-dim)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '28px',
          padding: 0,
          fontFamily: 'var(--font-body)',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-dim)' }}
      >
        <ArrowLeft size={16} />
        Build Your FinVeil Profile
      </button>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <label className="input-label">Loan Duration (months)</label>
          <input
            type="number"
            min={1}
            max={72}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="12"
            className="input-field"
          />
        </div>

        <div>
          <label className="input-label">Checking Account Status</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={checkNeg} onChange={(e) => { setCheckNeg(e.target.checked); setCheckNone(false); setCheckHigh(false); }} />
              Negative balance (&lt; 0 DM)
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={checkNone} onChange={(e) => { setCheckNone(e.target.checked); setCheckNeg(false); setCheckHigh(false); }} />
              No checking account
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={checkHigh} onChange={(e) => { setCheckHigh(e.target.checked); setCheckNeg(false); setCheckNone(false); }} />
              High balance (&ge; 200 DM)
            </label>
          </div>
        </div>

        <div>
          <label className="input-label">Credit History</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={creditPaid} onChange={(e) => { setCreditPaid(e.target.checked); setCreditNone(false); }} />
              Existing credits paid back
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={creditNone} onChange={(e) => { setCreditNone(e.target.checked); setCreditPaid(false); }} />
              No credits taken
            </label>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.08)',
            border: '1px solid rgba(255, 107, 107, 0.15)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '13px',
            color: 'var(--color-danger)',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px 24px', fontSize: '14px' }}
        >
          {submitting ? (
            <span className="btn-spinner" />
          ) : (
            <Lock size={15} strokeWidth={2.5} />
          )}
          {submitting ? 'Encrypting & Saving...' : 'Save Encrypted Profile'}
        </button>
      </form>
    </div>
  )
}
