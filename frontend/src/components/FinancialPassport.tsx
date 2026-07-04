import { useEffect, useMemo, useState } from 'react'
import { Lock, Eye, RefreshCw } from 'lucide-react'

export interface PassportScoreData {
  score: number | null
  tier: 'Tier A' | 'Tier B' | 'Tier C' | 'Declined' | null
  isLoading: boolean
}

interface FinancialPassportProps {
  walletAddress: string
  passportScore: PassportScoreData
}

function truncateWallet(address: string): string {
  if (!address) return 'Not connected'
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatScore(score: number | null): string {
  if (score === null) return '--'
  return score.toString()
}

export default function FinancialPassport({ walletAddress, passportScore }: FinancialPassportProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches)
    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)
    return () => mediaQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  const isPending = passportScore.isLoading || passportScore.score === null
  const cardTransform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
  const statusLabel = isFlipped ? 'Unsealed' : 'Sealed'

  const tierAccent = useMemo(() => {
    if (passportScore.tier === 'Tier A') return '#FFB000'
    if (passportScore.tier === 'Tier B') return '#6EE7FF'
    if (passportScore.tier === 'Tier C') return '#E8C468'
    if (passportScore.tier === 'Declined') return '#FF6B6B'
    return '#8A7D70'
  }, [passportScore.tier])

  return (
    <button
      type="button"
      onClick={() => setIsFlipped((v) => !v)}
      className="financial-passport"
      style={{
        marginBottom: '28px',
        width: '100%',
        maxWidth: '540px',
        marginLeft: 'auto',
        marginRight: 'auto',
        cursor: 'pointer',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        padding: 0,
        display: 'block',
      }}
      aria-label="Flip Financial Passport"
    >
      <div
        className="financial-passport-inner"
        style={{
          position: 'relative',
          height: '280px',
          width: '100%',
          transform: cardTransform,
          transitionDuration: reducedMotion ? '0ms' : '600ms',
        }}
      >
        {/* Front face — Sealed */}
        <div
          className="financial-passport-face"
          style={{
            position: 'absolute',
            inset: 0,
            border: '1px solid var(--color-line)',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, #0A0C0B, #0B1815)',
            padding: '20px',
            overflow: 'hidden',
          }}
        >
          <div className="financial-passport-scanlines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <div
            className="financial-passport-text"
            style={{
              position: 'relative',
              height: '100%',
              border: '1px solid var(--color-line)',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'auto' }}>
              <div>
                <p style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'var(--color-amber-dim)',
                  fontFamily: 'var(--font-mono)',
                  margin: 0,
                }}>
                  Encrypted Identity
                </p>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 3vw, 28px)',
                  color: 'var(--color-amber)',
                  margin: '8px 0 0',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}>
                  FinVeil Passport
                </h3>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'var(--color-bg-raised-3)',
                border: '1px solid var(--color-line)',
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isFlipped ? 'var(--color-mint)' : 'rgba(51, 255, 51, 0.4)',
                  boxShadow: isFlipped ? '0 0 8px rgba(51, 255, 51, 0.5)' : 'none',
                  transition: 'all 0.3s',
                }} />
                <span style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'var(--color-amber-dim)',
                fontFamily: 'var(--font-mono)',
                margin: '0 0 4px',
              }}>
                Wallet
              </p>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--color-amber)',
                margin: 0,
                opacity: 0.9,
              }}>
                {truncateWallet(walletAddress)}
              </p>
            </div>

            <div style={{
              marginTop: 'auto',
              border: '1px solid var(--color-line)',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={14} strokeWidth={2} style={{ color: 'var(--color-amber-dim)' }} />
                <span style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--color-amber-dim)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Sealed Credibility Signal
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: 'var(--color-amber)',
                fontFamily: 'var(--font-mono)',
                opacity: 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <Eye size={12} strokeWidth={2} />
                Tap to unseal
                <span className="financial-passport-cursor" style={{ marginLeft: '2px' }}>█</span>
              </span>
            </div>
          </div>
        </div>

        {/* Back face — Unsealed */}
        <div
          className="financial-passport-face financial-passport-back"
          style={{
            position: 'absolute',
            inset: 0,
            border: '1px solid var(--color-line)',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, #0A0C0B, #0B1815)',
            padding: '20px',
            overflow: 'hidden',
          }}
        >
          <div className="financial-passport-scanlines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <div
            className="financial-passport-text"
            style={{
              position: 'relative',
              height: '100%',
              border: '1px solid var(--color-line)',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(20px, 2.8vw, 26px)',
                color: 'var(--color-amber)',
                margin: 0,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}>
                Financial Passport
              </h3>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'var(--color-bg-raised-3)',
                border: '1px solid var(--color-line)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--color-mint)',
                  boxShadow: '0 0 8px rgba(51, 255, 51, 0.5)',
                }} />
                {statusLabel.toUpperCase()}
              </span>
            </div>

            <p style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: 'var(--color-amber-dim)',
              fontFamily: 'var(--font-mono)',
              margin: '0 0 4px',
            }}>
              Wallet Address
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-amber)',
              margin: 0,
              wordBreak: 'break-all',
              opacity: 0.8,
              lineHeight: 1.4,
            }}>
              {walletAddress || 'Not connected'}
            </p>

            <div style={{
              marginTop: 'auto',
              border: '1px solid var(--color-line)',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '18px',
            }}>
              {isPending ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-amber)' }}>
                  <RefreshCw size={18} strokeWidth={1.8} className={reducedMotion ? '' : 'btn-spinner'} style={{ position: 'static' }} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Computing credibility score</p>
                    <p style={{ fontSize: '11px', color: 'var(--color-amber-dim)', margin: '2px 0 0' }}>
                      Encrypted model output pending...
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.16em',
                      color: 'var(--color-amber-dim)',
                      fontFamily: 'var(--font-mono)',
                      margin: '0 0 4px',
                    }}>
                      Credibility Score
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(32px, 5vw, 44px)',
                      fontWeight: 700,
                      color: 'var(--color-amber)',
                      margin: 0,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                    }}>
                      {formatScore(passportScore.score)}
                    </p>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    fontWeight: 700,
                    color: tierAccent,
                    letterSpacing: '-0.01em',
                  }}>
                    {passportScore.tier}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}