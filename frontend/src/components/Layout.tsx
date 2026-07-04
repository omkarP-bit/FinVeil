import { Outlet, Link, useLocation } from 'react-router-dom'
import { Shield, Home, User, History, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function Layout() {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)

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
