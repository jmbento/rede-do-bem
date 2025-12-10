import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import DonorDashboard from './pages/DonorDashboard'
import RequesterDashboard from './pages/RequesterDashboard'
import AdminPanel from './pages/AdminPanel'
import DriverMissions from './pages/DriverMissions'
import InteractiveMap from './components/Map/InteractiveMap'
import BottomBar from './components/Navigation/BottomBar'
import LoadingSpinner from './components/UI/LoadingSpinner'
import './index.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-navy font-semibold">Carregando Rede do Bem...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Onboarding />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboards Específicos */}
        <Route
          path="/doador"
          element={
            <ProtectedRoute>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/solicitante"
          element={
            <ProtectedRoute>
              <RequesterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Mapa Geral */}
        <Route
          path="/mapa"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-light pb-24">
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-navy mb-4">Mapa Geral</h1>
                  <div className="h-[calc(100vh-12rem)]">
                    <InteractiveMap />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Outras rotas (em construção) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-light pb-24">
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-navy">Página em construção</h1>
                  <p className="text-gray-600 mt-2">Esta funcionalidade está sendo desenvolvida.</p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>

      {/* Bottom Bar apenas para usuários autenticados */}
      {user && <BottomBar />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
