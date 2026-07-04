import { CheckCircle, Clock, XCircle } from 'lucide-react'

const permits = [
  { app: 'GreenLeaf Rentals', lens: 'Rental-Readiness', status: 'used', time: '2 hrs ago' },
  { app: 'PayLater Co.', lens: 'BNPL Affordability', status: 'used', time: '5 days ago' },
  { app: 'TestBank', lens: 'Credit Tier', status: 'active', time: 'Expires in 23h' },
]

export default function AccessLog() {
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

      <button className="w-full mt-6 px-4 py-3 rounded-xl border border-danger/30 text-sm font-medium text-danger hover:bg-red-50 transition-colors cursor-pointer">
        Revoke all active permits
      </button>
    </div>
  )
}
