import { Outlet, Link, useLocation } from 'react-router-dom'
import { Shield, Home, User, History, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function Layout() {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const metaMaskConnector = connectors.find((c) =>
    c.id.toLowerCase().includes('meta') || c.name.toLowerCase().includes('meta')
  )
  const primaryConnector = metaMaskConnector ?? connectors[0]

  const handleConnect = () => {
    if (!primaryConnector) return
    connect({ connector: primaryConnector })
  }

  const nav = [
    { to: '/marketplace', label: 'Lenses', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: User },
    { to: '/access-log', label: 'History', icon: History },
  ]

  return (
    <div className="flex flex-col min-h-svh">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/marketplace" className="flex items-center gap-2 text-primary font-semibold text-lg no-underline">
            <Shield size={22} />
            FinVeil
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                  location.pathname === to
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:text-text hover:bg-surface-alt'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isPending || !primaryConnector}
                className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-text hover:bg-surface-alt disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isPending ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="ml-2 flex items-center gap-2">
                <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-mono border border-emerald-200">
                  {address ? truncateAddress(address) : 'Connected'}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-text-muted hover:text-danger hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            )}
            <button
              onClick={logout}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-danger hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
