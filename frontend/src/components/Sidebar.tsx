import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAccount } from 'wagmi'
import {
  LayoutDashboard, Store, UserCircle, History, ShieldCheck,
  Wallet, ChevronLeft
} from 'lucide-react'

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
    <div className="dh-avatar dh-avatar-lg" style={{ background: gradients[idx] }}>
      {letter}
    </div>
  )
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const MENU_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/marketplace', label: 'Lenses', icon: Store },
  { to: '/build-profile', label: 'Build Profile', icon: UserCircle },
  { to: '/access-log', label: 'Access Log', icon: History },
  { to: '/kyc-setup', label: 'KYC Verification', icon: ShieldCheck },
]

interface SidebarProps {
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const { address, isConnected } = useAccount()

  return (
    <aside
      className={`h-full bg-surface-alt border-r border-border flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-0 overflow-hidden border-r-0' : 'w-60 lg:w-64'
      }`}
    >
      {/* User section */}
      <div className="px-4 pt-5 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <AvatarLetter name={user?.name} email={user?.email} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-text-tertiary truncate mt-0.5">
              {user?.email || ''}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-accent-400 bg-accent-400/5 px-3 py-1.5 rounded-md border border-accent-400/10">
          <Wallet size={12} />
          {isConnected && address ? truncateAddress(address) : 'Wallet disconnected'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest px-2 pb-2 pt-1">
          Navigation
        </p>
        {MENU_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="shrink-0 border-t border-border p-3">
        <button
          onClick={onToggleCollapse}
          className="sidebar-link w-full text-xs text-text-tertiary hover:text-text-secondary"
        >
          <ChevronLeft
            size={15}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
          <span>Collapse</span>
        </button>
      </div>
    </aside>
  )
}
