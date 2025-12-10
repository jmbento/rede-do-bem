import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

/**
 * Dashboard - Roteador baseado em perfil
 */
const Dashboard = () => {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  // Redirecionar para dashboard específico baseado no role
  const roleRoutes = {
    doador: '/doador',
    solicitante: '/solicitante',
    distribuidor: '/missoes',
    motorista: '/missoes', // Alias caso usem motorista
    armazenador: '/estoque',
    gestor: '/admin',
    admin: '/admin',
  }

  const targetRoute = roleRoutes[profile.role]
  
  if (targetRoute) {
    return <Navigate to={targetRoute} replace />
  }

  // Fallback para mapa geral
  return <Navigate to="/mapa" replace />
}

export default Dashboard
