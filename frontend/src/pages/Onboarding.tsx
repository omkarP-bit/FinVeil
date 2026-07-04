import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Play } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function Onboarding() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)

  const handleOAuth = async (provider: string) => {
    setLoading(true)
    try {
      const { data } = await authApi.oauthCallback(provider, `${provider}-code-demo`)
      login(data.user, data.accessToken)
      navigate('/marketplace')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh px-4">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <Shield size={32} className="text-primary" />
      </div>

      <h1 className="text-3xl font-bold text-text-heading mb-2">FinVeil</h1>
      <p className="text-text-muted text-center mb-8 max-w-xs">
        Your Encrypted Financial Passport
      </p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => handleOAuth('google')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-white font-medium text-sm text-text hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <button
          onClick={() => handleOAuth('apple')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-white font-medium text-sm text-text hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-text-muted">or</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/demo-seed')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-primary font-medium text-sm hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <Play size={16} />
          Quick Demo (seed users)
        </button>
      </div>

      <p className="text-xs text-text-muted mt-6 text-center max-w-xs leading-relaxed">
        Your numbers never leave your device unencrypted.
      </p>
    </div>
  )
}
