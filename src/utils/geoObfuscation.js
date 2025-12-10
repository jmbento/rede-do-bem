/**
 * Geo-Obfuscation para proteção de privacidade (LGPD)
 * Exibe apenas bairro/CEP aproximado para público geral
 * Endereço completo APENAS para distribuidor com missão aceita
 */

export const maskAddress = (user, currentUserRole, hasMission = false) => {
  // Se for distribuidor com missão aceita, mostra endereço completo
  if (currentUserRole === 'distribuidor' && hasMission) {
    return user.address || `${user.neighborhood}, ${user.city} - ${user.state}`
  }

  // Admin/Gestor sempre vê tudo
  if (['admin', 'gestor'].includes(currentUserRole)) {
    return user.address || `${user.neighborhood}, ${user.city} - ${user.state}`
  }

  // Caso contrário, mostra apenas bairro e cidade
  return `${user.neighborhood || 'Bairro não informado'}, ${user.city || ''}`
}

export const maskZipCode = (zipcode) => {
  if (!zipcode) return 'CEP não informado'
  // Exibe apenas primeiros 5 dígitos: 12345-XXX
  return `${zipcode.substring(0, 5)}-XXX`
}

// Ofuscar coordenadas para mapas públicos (precisão reduzida)
export const obfuscateCoordinates = (lat, lng, precision = 2) => {
  if (!lat || !lng) return { lat: null, lng: null }
  return {
    lat: parseFloat(lat.toFixed(precision)),
    lng: parseFloat(lng.toFixed(precision))
  }
}

// Verificar se usuário tem permissão para ver endereço completo
export const canViewFullAddress = (currentUserRole, targetUserId, missions = []) => {
  // Admin/Gestor sempre podem
  if (['admin', 'gestor'].includes(currentUserRole)) return true

  // Distribuidor pode SE tiver missão aceita para esse destino
  if (currentUserRole === 'distribuidor') {
    return missions.some(m => 
      (m.destination_user_id === targetUserId || m.origin_user_id === targetUserId) &&
      ['aceita', 'em_rota'].includes(m.status)
    )
  }

  return false
}

export default {
  maskAddress,
  maskZipCode,
  obfuscateCoordinates,
  canViewFullAddress
}
