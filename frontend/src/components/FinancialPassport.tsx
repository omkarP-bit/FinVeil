import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

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
    if (passportScore.tier === 'Tier A') return 'text-emerald-300'
    if (passportScore.tier === 'Tier B') return 'text-cyan-300'
    if (passportScore.tier === 'Tier C') return 'text-amber-300'
    if (passportScore.tier === 'Declined') return 'text-red-300'
    return 'text-slate-300'
  }, [passportScore.tier])

  return (
    <button
      type="button"
      onClick={() => setIsFlipped((v) => !v)}
      className="financial-passport group mb-6 w-full max-w-xl mx-auto cursor-pointer text-left font-space-mono"
      aria-label="Flip Financial Passport"
    >
      <div
        className="financial-passport-inner relative h-[260px] sm:h-[280px] w-full"
        style={{
          transform: cardTransform,
          transitionDuration: reducedMotion ? '0ms' : '600ms',
        }}
      >
        <div className="financial-passport-face absolute inset-0 border border-[#C9A961]/55 bg-[#0A0A0A] p-4 sm:p-5">
          <div className="financial-passport-scanlines pointer-events-none absolute inset-0" />
          <div className="financial-passport-text relative h-full border border-[#C9A961]/35 bg-[#0A0A0A] p-4 sm:p-5">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A5C00]">Encrypted Identity</p>
                <h3 className="mt-2 text-2xl sm:text-3xl text-[#FFB000]">
                  FinVeil Passport
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 ${isFlipped ? 'bg-[#66FF66]' : 'bg-[#33FF33]/70'} rounded-full border border-black/40`}
                  aria-hidden="true"
                />
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#8A5C00]">{statusLabel}</span>
              </div>
            </div>

            <p className="text-xs uppercase tracking-[0.18em] text-[#8A5C00]">Wallet</p>
            <p className="mt-1 font-mono text-sm sm:text-base text-[#FFB000]">{truncateWallet(walletAddress)}</p>

            <div className="mt-6 border border-[#C9A961]/30 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-[#8A5C00]">
                <span className="text-xs uppercase tracking-[0.16em]">Sealed Credibility Signal</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="h-7 w-40 rounded-md bg-white/10 blur-[1px]" />
                <span className="text-xs text-[#FFB000]">
                  Tap to unseal
                  <span className="financial-passport-cursor ml-1">█</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="financial-passport-face financial-passport-back absolute inset-0 border border-[#C9A961]/55 bg-[#0A0A0A] p-4 sm:p-5">
          <div className="financial-passport-scanlines pointer-events-none absolute inset-0" />
          <div className="financial-passport-text relative h-full border border-[#C9A961]/35 bg-[#0A0A0A] p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl sm:text-3xl text-[#FFB000]">
                Financial Passport
              </h3>
              <span className="flex items-center gap-2 border border-[#8A5C00] px-3 py-1 text-[10px] tracking-[0.2em] text-[#8A5C00]">
                <span
                  className={`h-2.5 w-2.5 ${isFlipped ? 'bg-[#66FF66]' : 'bg-[#33FF33]/70'} rounded-full border border-black/40`}
                  aria-hidden="true"
                />
                {statusLabel.toUpperCase()}
              </span>
            </div>

            <p className="text-xs uppercase tracking-[0.18em] text-[#8A5C00]">Wallet Address</p>
            <p className="mt-1 break-all font-mono text-[11px] sm:text-xs text-[#FFB000]">{walletAddress || 'Not connected'}</p>

            <div className="mt-6 border border-[#C9A961]/30 bg-black/30 p-4">
              {isPending ? (
                <div className="flex items-center gap-3 text-[#FFB000]">
                  <Loader2 size={18} className={reducedMotion ? '' : 'animate-spin'} />
                  <div>
                    <p className="text-sm font-medium">Computing credibility score</p>
                    <p className="text-xs text-[#8A5C00]">Encrypted model output pending...</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8A5C00]">Credibility Score</p>
                    <p className="mt-1 text-4xl sm:text-5xl leading-none text-[#FFB000]">{formatScore(passportScore.score)}</p>
                  </div>
                  <p className={`text-base sm:text-lg font-semibold ${tierAccent}`}>{passportScore.tier}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}