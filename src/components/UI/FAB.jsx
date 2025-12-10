import { Plus } from 'lucide-react'

/**
 * Floating Action Button
 */
const FAB = ({ onClick, icon: Icon = Plus, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`fab ${className}`}
      role="button"
      aria-label="Ação principal"
    >
      <Icon size={28} strokeWidth={2.5} />
    </button>
  )
}

export default FAB
