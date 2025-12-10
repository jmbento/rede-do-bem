/**
 * Algoritmo de Prioridade da Fila
 * Score = (Nível Urgência * 10) + (Dias na Fila * 1)
 */

/**
 * Calcula o score de prioridade baseado em:
 * - Nível de urgência (1-3): weight = 10
 * - Tempo na fila (dias): weight = 1
 */
export const calculatePriority = (urgencyLevel, createdAt) => {
  const now = new Date()
  const requestDate = new Date(createdAt)
  
  // Calcular dias na fila
  const daysInQueue = Math.floor((now - requestDate) / (1000 * 60 * 60 * 24))
  
  // Score = (urgencyLevel * 10) + (daysInQueue * 1)
  const score = (urgencyLevel * 10) + daysInQueue
  
  return score
}

export const sortRequestsByPriority = (requests) => {
  return requests.sort((a, b) => {
    const scoreA = calculatePriority(a.urgency_level, a.created_at)
    const scoreB = calculatePriority(b.urgency_level, b.created_at)
    return scoreB - scoreA // Maior score primeiro
  })
}

/**
 * Retorna label descritivo do nível de urgência
 */
export const getUrgencyLabel = (level) => {
  const labels = {
    1: 'Baixa Urgência',
    2: 'Urgência Média',
    3: 'Alta Urgência'
  }
  return labels[level] || 'Não especificado'
}

/**
 * Retorna classe de cor para o nível de urgência
 */
export const getUrgencyColor = (level) => {
  const colors = {
    1: 'text-green-600',
    2: 'text-yellow-600',
    3: 'text-red-600'
  }
  return colors[level] || 'text-gray-600'
}

export default {
  calculatePriority,
  sortRequestsByPriority,
  getUrgencyLabel,
  getUrgencyColor
}
