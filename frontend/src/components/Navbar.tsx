import { useAuthStore } from '../stores/authStore'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { LogOut, Wallet } from 'lucide-react'

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function AvatarLetter({ name, email }: { name?: string; email?: string }) {
  const letter = (name?.[0] || email?.[0] || 'U').toUpperCase()
  const gradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #06b6d4, #14b8a6)',
    'linear-gradient(135deg, #f59e0b, #f97316)',
    'linear-gradient(135deg, #22c55e, #10b981)',
    'linear-gradient(135deg, #a78bfa, #6366f1)',
    'linear-gradient(135deg, #f472b6, #ec4899)',
  ]
  const idx = letter.charCodeAt(0) % gradients.length
  return (
    <div className="dh-avatar" style={{ background: gradients[idx] }}>
      {letter}
    </div>
  )
}

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const primaryConnector = connectors.find(
    (c) => c.id.toLowerCase().includes('meta') || c.name.toLowerCase().includes('meta')
  ) ?? connectors[0]

  return (
    <div className="h-14 dh-card-static !rounded-none border-x-0 border-t-0 flex items-center justify-between px-4 lg:px-5 shrink-0">
      <div className="flex items-center gap-3">
        <AvatarLetter name={user?.name} email={user?.email} />
        <div>
          <p className="text-sm font-semibold text-text-primary leading-tight">
            {user?.name || user?.email || 'User'}
          </p>
          <p className="text-xs text-text-tertiary leading-tight">
            {user?.email || ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isConnected ? (
          <button
            onClick={() => primaryConnector && connect({ connector: primaryConnector })}
            disabled={isPending || !primaryConnector}
            className="glow-btn glow-btn-outline flex items-center gap-2 !py-1.5 !px-3 !text-xs"
          >
            <Wallet size={13} />
            {isPending ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-accent-400 bg-accent-400/5 px-2.5 py-1.5 rounded-lg border border-accent-400/10">
              <Wallet size={11} className="inline mr-1 -mt-0.5" />
              {address ? truncateAddress(address) : 'Connected'}
            </span>
            <button
              onClick={() => disconnect()}
              className="glow-btn glow-btn-outline !py-1.5 !px-2.5 !text-xs"
              title="Disconnect wallet"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={logout}
          className="glow-btn glow-btn-outline flex items-center gap-1.5 !py-1.5 !px-3 !text-xs"
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
