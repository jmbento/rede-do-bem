import { getStatusLabel, getStatusBadge } from '../../utils/itemStatusFlow'

/**
 * Badge de Status com cores
 */
const StatusBadge = ({ status, className = '' }) => {
  return (
    <span className={`${getStatusBadge(status)} ${className}`}>
      {getStatusLabel(status)}
    </span>
  )
}

export default StatusBadge
