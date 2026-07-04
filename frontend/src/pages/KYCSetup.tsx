import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserCheck, Lock } from 'lucide-react'
import { kycApi } from '../services/api'
import { useCofhejs } from '../hooks/useCofhejs'
import { stringToUint32 } from '../services/cofhejs'

export default function KYCSetup() {
  const navigate = useNavigate()
  const { encryptFields } = useCofhejs()
  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    govId: '',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      // Convert strings to uint32 values for FHE encryption
      const nameVal = stringToUint32(form.fullName)
      const dobVal = parseInt(form.dob.replace(/-/g, ''), 10) || 0
      const idVal = stringToUint32(form.govId)
      const addrVal = stringToUint32(form.address)

      const encrypted = await encryptFields([nameVal, dobVal, idVal, addrVal])

      if (encrypted) {
        const [nameHash, dobEncoded, idHash, addressHash] = encrypted
        await kycApi.submitEncrypted({ nameHash, dobEncoded, idHash, addressHash })
      } else {
        await kycApi.submit({
          nameHash: form.fullName,
          dobEncoded: form.dob.replace(/-/g, ''),
          idHash: form.govId,
          addressHash: form.address,
        })
      }

      setSuccess(true)
      setTimeout(() => navigate('/marketplace'), 1500)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit KYC')
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
        Verify Your Identity (once)
      </button>

      {success ? (
        <div style={{
          background: 'rgba(232, 196, 104, 0.06)',
          border: '1px solid rgba(232, 196, 104, 0.15)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          animation: 'slideUp 0.4s ease',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(232, 196, 104, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <UserCheck size={28} strokeWidth={2} style={{ color: 'var(--color-gold)' }} />
          </div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-gold)',
            margin: 0,
          }}>
            KYC Submitted Successfully!
          </p>
          <p style={{
            fontSize: '14px',
            color: 'var(--color-text-dim)',
            marginTop: '8px',
          }}>
            Redirecting to marketplace...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div>
            <label className="input-label">Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="John Doe"
              className="input-field gold"
            />
          </div>
          <div>
            <label className="input-label">Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="input-field gold"
            />
          </div>
          <div>
            <label className="input-label">Government ID #</label>
            <input
              type="text"
              value={form.govId}
              onChange={(e) => setForm({ ...form, govId: e.target.value })}
              placeholder="XXX-XX-XXXX"
              className="input-field gold"
            />
          </div>
          <div>
            <label className="input-label">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St, City"
              className="input-field gold"
            />
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
            className="btn btn-gold"
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {submitting ? (
              <span className="btn-spinner" style={{ position: 'static', borderColor: '#0A0A0A', borderTopColor: 'transparent' }} />
            ) : (
              <Lock size={15} strokeWidth={2.5} />
            )}
            {submitting ? 'Encrypting & Submitting...' : 'Submit KYC'}
          </button>
        </form>
      )}
    </div>
  )
}
