import { Home, Plus, User, Map, Package, ClipboardList, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Bottom Bar - Navegação variável por perfil
 */
const BottomBar = () => {
  const location = useLocation()
  const { profile } = useAuth()

  if (!profile) return null

  // Configuração de navegação por role
  const getNavItems = () => {
    switch (profile.role) {
      case 'doador':
      case 'solicitante':
        return [
          { path: '/meus-itens', icon: Package, label: 'Meus Itens' },
          { path: '/nova-acao', icon: Plus, label: 'Nova Ação' },
          { path: '/perfil', icon: User, label: 'Perfil' },
        ]
      
      case 'distribuidor':
        return [
          { path: '/missoes', icon: ClipboardList, label: 'Missões' },
          { path: '/mapa', icon: Map, label: 'Mapa' },
          { path: '/historico', icon: Package, label: 'Histórico' },
        ]
      
      case 'gestor':
      case 'admin':
        return [
          { path: '/dashboard', icon: Home, label: 'Dashboard' },
          { path: '/aprovacoes', icon: Users, label: 'Aprovações' },
          { path: '/inventario', icon: Package, label: 'Inventário' },
        ]
      
      case 'armazenador':
        return [
          { path: '/estoque', icon: Package, label: 'Estoque' },
          { path: '/mapa', icon: Map, label: 'Mapa' },
          { path: '/perfil', icon: User, label: 'Perfil' },
        ]
      
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <nav className="bottom-bar">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`bottom-bar-item ${isActive ? 'bottom-bar-item-active' : ''}`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default BottomBar
