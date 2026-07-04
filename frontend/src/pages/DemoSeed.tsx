import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, Loader2, CheckCircle } from 'lucide-react'
import { demoApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

interface DemoUser {
  name: string
  profile: { income: number; spendVolatility: number; debtRatio: number; txnHistoryScore: number }
  tokens: { accessToken: string }
}

export default function DemoSeed() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const [demoUsers, setDemoUsers] = useState<DemoUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await demoApi.seed()
      setDemoUsers(data.users)
    } catch {
      setError('Failed to seed demo data. Make sure the backend is running.')
      setLoading(false)
    }
  }

  const handleLoginAs = (user: DemoUser) => {
    login({ id: `demo-${user.name}`, wallet: '0x' + '0'.repeat(40) }, user.tokens.accessToken)
    navigate('/marketplace')
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Users size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-heading">Demo Mode</h1>
          <p className="text-xs text-text-muted">Seed demo users with distinct financial profiles</p>
        </div>
      </div>

      {!demoUsers && (
        <div className="bg-white rounded-2xl border border-border p-6 text-center">
          <p className="text-sm text-text-muted mb-4">
            Create 3 demo user profiles to walk through the full FinVeil flow:
          </p>
          <ul className="text-left text-sm space-y-2 mb-6">
            <li className="flex items-center gap-2 text-text">
              <span className="w-2 h-2 rounded-full bg-success" />
              Alice — High income, low risk → Tier A
            </li>
            <li className="flex items-center gap-2 text-text">
              <span className="w-2 h-2 rounded-full bg-warning" />
              Bob — Medium income, moderate risk → Tier B
            </li>
            <li className="flex items-center gap-2 text-text">
              <span className="w-2 h-2 rounded-full bg-danger" />
              Charlie — Low income, high risk → Declined
            </li>
          </ul>
          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            {loading ? 'Seeding...' : 'Seed Demo Users'}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-sm text-danger">
          {error}
          <button
            onClick={handleSeed}
            className="block mt-2 text-primary hover:underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {demoUsers && (
        <div className="space-y-3">
          {demoUsers.map((user, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-success" />
                  <span className="font-medium text-text-heading text-sm">{user.name}</span>
                </div>
                <span className="text-xs text-text-muted font-mono">
                  ${user.profile.income.toLocaleString()}/mo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-surface-alt rounded-lg p-2 text-center">
                  <p className="text-[10px] text-text-muted">Volatility</p>
                  <p className="text-sm font-medium">{user.profile.spendVolatility}%</p>
                </div>
                <div className="bg-surface-alt rounded-lg p-2 text-center">
                  <p className="text-[10px] text-text-muted">Debt Ratio</p>
                  <p className="text-sm font-medium">{user.profile.debtRatio}%</p>
                </div>
                <div className="bg-surface-alt rounded-lg p-2 text-center">
                  <p className="text-[10px] text-text-muted">History</p>
                  <p className="text-sm font-medium">{'★'.repeat(user.profile.txnHistoryScore)}</p>
                </div>
              </div>
              <button
                onClick={() => handleLoginAs(user)}
                className="w-full px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer"
              >
                Login as {user.name.split(' ')[0]}
              </button>
            </div>
          ))}
          <p className="text-xs text-text-muted text-center mt-2">
            Each user has an encrypted profile on-chain. Apply lenses to see different tier outcomes.
          </p>
        </div>
      )}
    </div>
  )
}
