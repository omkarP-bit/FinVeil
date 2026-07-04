import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, Loader2 } from 'lucide-react'
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
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-6 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Verify Your Identity (once)
      </button>

      {success ? (
        <div className="bg-success/10 border border-success/20 rounded-2xl p-8 text-center">
          <Shield size={32} className="text-success mx-auto mb-3" />
          <p className="text-lg font-semibold text-success">KYC Submitted Successfully!</p>
          <p className="text-sm text-text-muted mt-2">Redirecting to marketplace...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">Government ID #</label>
            <input
              type="text"
              value={form.govId}
              onChange={(e) => setForm({ ...form, govId: e.target.value })}
              placeholder="XXX-XX-XXXX"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1.5">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St, City"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
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
            {submitting ? 'Submitting...' : 'Submit KYC'}
          </button>
        </form>
      )}
    </div>
  )
}
