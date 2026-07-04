import { Outlet, Link, useLocation } from 'react-router-dom'
import { Shield, Home, User, History, LogOut, Wallet } from 'lucide-react'
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(6, 16, 13, 0.75)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--color-line)',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link to="/marketplace" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--color-amber)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '17px',
            letterSpacing: '-0.02em',
            textDecoration: 'none',
          }}>
            <Shield size={20} strokeWidth={2.5} />
            FinVeil
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  color: location.pathname === to ? 'var(--color-amber)' : 'var(--color-text-dim)',
                  background: location.pathname === to ? 'rgba(255, 176, 0, 0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== to) {
                    e.currentTarget.style.color = 'var(--color-text)'
                    e.currentTarget.style.background = 'rgba(255, 176, 0, 0.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== to) {
                    e.currentTarget.style.color = 'var(--color-text-dim)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </Link>
            ))}

            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isPending || !primaryConnector}
                className="btn btn-ghost"
                style={{
                  marginLeft: '8px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                <Wallet size={14} strokeWidth={2} />
                {isPending ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'var(--color-bg-raised)',
                  border: '1px solid var(--color-line)',
                  color: 'var(--color-text)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-mint)',
                    boxShadow: '0 0 6px rgba(51, 255, 51, 0.5)',
                  }} />
                  {address ? truncateAddress(address) : 'Connected'}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  Disconnect
                </button>
              </div>
            )}

            <button
              onClick={logout}
              className="btn btn-ghost"
              style={{
                marginLeft: '4px',
                padding: '7px 12px',
                fontSize: '12.5px',
                fontWeight: 500,
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-danger)'
                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <LogOut size={14} strokeWidth={1.8} />
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '28px 24px' }}>
        <Outlet />
      </main>
    </div>
  )
}
