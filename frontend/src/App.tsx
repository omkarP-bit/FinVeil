import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Onboarding from './pages/Onboarding'
import BuildProfile from './pages/BuildProfile'
import Marketplace from './pages/Marketplace'
import Dashboard from './pages/Dashboard'
import AccessLog from './pages/AccessLog'
import KYCSetup from './pages/KYCSetup'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Marketplace /> : <Onboarding />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/build-profile" element={<BuildProfile />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/access-log" element={<AccessLog />} />
          <Route path="/kyc-setup" element={<KYCSetup />} />
        </Route>
      </Route>
    </Routes>
  )
}
