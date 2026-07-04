import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, Lock } from 'lucide-react'

export default function KYCSetup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    govId: '',
    address: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Stub: encrypt and submit KYC
    console.log('KYC data:', form)
    navigate('/marketplace')
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

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
          <Lock size={16} className="text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-text-muted leading-relaxed">
            Encrypted on this device — stored once, reused every time you are asked for KYC.
          </p>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors cursor-pointer"
        >
          <Shield size={16} />
          Encrypt & Submit
        </button>
      </form>
    </div>
  )
}
