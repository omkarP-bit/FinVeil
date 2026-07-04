import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { supabase } from '../services/supabase'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function Onboarding() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        setLoading(true)
        setError(null)
        try {
          const { data } = await authApi.supabaseLogin(session.access_token)
          login(data.user, data.accessToken)
          if (data.profileExists) {
            navigate('/marketplace')
          } else {
            navigate('/new-user')
          }
        } catch {
          setError('Authentication failed. Please try again.')
          setLoading(false)
        }
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [navigate, login])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (oauthError) throw oauthError
    } catch {
      setError('Failed to open Google sign-in. Check your Supabase configuration.')
      setLoading(false)
    }
  }

  const missingConfig = !import.meta.env.VITE_SUPABASE_ANON_KEY || !import.meta.env.VITE_SUPABASE_URL

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--color-bg)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255, 176, 0, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(255, 176, 0, 0.1)',
          border: '1px solid rgba(255, 176, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}>
          <Lock size={28} strokeWidth={2} style={{ color: 'var(--color-amber)' }} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 5vw, 42px)',
          fontWeight: 700,
          color: 'var(--color-text-heading)',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          FinVeil
        </h1>

        <p style={{
          color: 'var(--color-text-dim)',
          textAlign: 'center',
          margin: '10px 0 36px',
          maxWidth: '280px',
          fontSize: '15px',
          lineHeight: 1.5,
        }}>
          Your Encrypted Financial Passport
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '340px',
        }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || missingConfig}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: '1px solid var(--color-line)',
              background: 'var(--color-bg-raised)',
              color: 'var(--color-text)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading || missingConfig ? 'not-allowed' : 'pointer',
              opacity: loading || missingConfig ? 0.5 : 1,
              transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={(e) => {
              if (!loading && !missingConfig) {
                e.currentTarget.style.borderColor = 'var(--color-amber-dim)'
                e.currentTarget.style.background = 'var(--color-bg-raised-2)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-line)'
              e.currentTarget.style.background = 'var(--color-bg-raised)'
            }}
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
            disabled
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: '1px solid var(--color-line)',
              background: 'var(--color-bg-raised)',
              color: 'var(--color-text-dim)',
              fontSize: '14px',
              fontWeight: 500,
              opacity: 0.4,
              cursor: 'not-allowed',
              fontFamily: 'var(--font-body)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple (coming soon)
          </button>
        </div>

        {missingConfig && (
          <p style={{
            marginTop: '16px',
            fontSize: '12px',
            color: 'var(--color-warning)',
            textAlign: 'center',
          }}>
            Supabase not configured. Add <code style={{ background: 'var(--color-bg-raised-2)', padding: '1px 6px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> and{' '}
            <code style={{ background: 'var(--color-bg-raised-2)', padding: '1px 6px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code> to <code style={{ background: 'var(--color-bg-raised-2)', padding: '1px 6px', borderRadius: '4px' }}>frontend/.env</code>.
          </p>
        )}

        {error && (
          <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--color-danger)' }}>{error}</p>
        )}

        {loading && (
          <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--color-text-dim)' }}>Signing in...</p>
        )}

        <p style={{
          marginTop: '28px',
          fontSize: '12px',
          color: 'var(--color-text-dim)',
          textAlign: 'center',
          maxWidth: '280px',
          lineHeight: 1.6,
          opacity: 0.7,
        }}>
          Your numbers never leave your device unencrypted.
        </p>
      </div>
    </div>
  )
}
