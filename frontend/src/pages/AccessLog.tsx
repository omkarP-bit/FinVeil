import { useState, useEffect } from 'react'
import { CheckCircle, Clock, Loader2 } from 'lucide-react'
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
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-text-heading mb-6">Access Log</h1>

      <div className="space-y-3">
        {permits.map((p, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-border p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-text-heading">{p.app}</p>
              <p className="text-xs text-text-muted">{p.lens}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs">
                {p.status === 'used' ? (
                  <>
                    <CheckCircle size={12} className="text-text-muted" />
                    <span className="text-text-muted">Used</span>
                  </>
                ) : (
                  <>
                    <Clock size={12} className="text-success" />
                    <span className="text-success font-medium">Active</span>
                  </>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">{p.time}</p>
            </div>
          </div>
        ))}
      </div>

      {permits.length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">
          No permit activity yet. Apply a lens to get started.
        </div>
      )}

      <button className="w-full mt-6 px-4 py-3 rounded-xl border border-danger/30 text-sm font-medium text-danger hover:bg-red-50 transition-colors cursor-pointer">
        Revoke all active permits
      </button>
    </div>
  )
}
