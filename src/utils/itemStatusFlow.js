/**
 * Fluxo de Status dos Itens
 * Gerencia as transições de status e atualização de holder
 */

import { supabase } from '../lib/supabase'

// Estados válidos
export const ITEM_STATUS = {
  DISPONIVEL: 'disponivel',
  AGUARDANDO_COLETA: 'aguardando_coleta',
  EM_TRANSITO: 'em_transito',
  EM_USO: 'em_uso',
  MANUTENCAO: 'manutencao'
}

// Transições válidas
const VALID_TRANSITIONS = {
  [ITEM_STATUS.DISPONIVEL]: [ITEM_STATUS.AGUARDANDO_COLETA, ITEM_STATUS.MANUTENCAO],
  [ITEM_STATUS.AGUARDANDO_COLETA]: [ITEM_STATUS.EM_TRANSITO, ITEM_STATUS.DISPONIVEL],
  [ITEM_STATUS.EM_TRANSITO]: [ITEM_STATUS.EM_USO, ITEM_STATUS.DISPONIVEL],
  [ITEM_STATUS.EM_USO]: [ITEM_STATUS.DISPONIVEL, ITEM_STATUS.MANUTENCAO],
  [ITEM_STATUS.MANUTENCAO]: [ITEM_STATUS.DISPONIVEL]
}

export const canTransition = (currentStatus, newStatus) => {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false
}

/**
 * Verifica se pode mover item para um destino específico
 */
export const canMoveItem = (itemStatus, currentHolder, destinationId) => {
  // Regra 1: Item disponível pode ir para qualquer pessoa
  if (itemStatus === 'disponivel') return true
  
  // Regra 2: Se em trânsito, apenas o holder atual (distribuidor) pode mover
  if (itemStatus === 'em_transito') {
    return currentHolder === destinationId
  }
  
  // Regra 3: Se em uso, apenas o holder atual (solicitante) pode devolver
  if (itemStatus === 'em_uso') {
    return currentHolder === destinationId
  }
  
  return false
}

// Cadastro inicial: doador registra item
export const registerItem = async (itemData, donorId) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .insert({
        ...itemData,
        status: ITEM_STATUS.DISPONIVEL,
        holder_id: donorId,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao registrar item:', error)
    return { success: false, error }
  }
}

// Match: Sistema encontra solicitante e muda para aguardando coleta
export const matchItemToRequester = async (itemId, requesterId, requestId) => {
  try {
    // Atualizar item
    const { error: itemError } = await supabase
      .from('items')
      .update({ status: ITEM_STATUS.AGUARDANDO_COLETA })
      .eq('id', itemId)

    if (itemError) throw itemError

    // Atualizar request como atendido
    const { error: requestError } = await supabase
      .from('requests')
      .update({ 
        status: 'atendido',
        matched_item_id: itemId 
      })
      .eq('id', requestId)

    if (requestError) throw requestError

    return { success: true }
  } catch (error) {
    console.error('Erro ao fazer match:', error)
    return { success: false, error }
  }
}

// Coleta iniciada: item em trânsito
export const startTransit = async (itemId, driverId) => {
  try {
    const { error } = await supabase
      .from('items')
      .update({ status: ITEM_STATUS.EM_TRANSITO })
      .eq('id', itemId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro ao iniciar trânsito:', error)
    return { success: false, error }
  }
}

// Entrega confirmada: atualiza holder e status
export const confirmDelivery = async (itemId, newHolderId, isRequester = true) => {
  try {
    const newStatus = isRequester ? ITEM_STATUS.EM_USO : ITEM_STATUS.DISPONIVEL

    const { data, error } = await supabase
      .from('items')
      .update({ 
        status: newStatus,
        holder_id: newHolderId 
      })
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao confirmar entrega:', error)
    return { success: false, error }
  }
}

// Get status badge class
export const getStatusBadge = (status) => {
  const badges = {
    [ITEM_STATUS.DISPONIVEL]: 'badge-disponivel',
    [ITEM_STATUS.AGUARDANDO_COLETA]: 'bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium',
    [ITEM_STATUS.EM_TRANSITO]: 'badge-em-transito',
    [ITEM_STATUS.EM_USO]: 'badge-em-uso',
    [ITEM_STATUS.MANUTENCAO]: 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium'
  }
  return badges[status] || 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'
}

export const getStatusLabel = (status) => {
  const labels = {
    [ITEM_STATUS.DISPONIVEL]: 'Disponível',
    [ITEM_STATUS.AGUARDANDO_COLETA]: 'Aguardando Coleta',
    [ITEM_STATUS.EM_TRANSITO]: 'Em Trânsito',
    [ITEM_STATUS.EM_USO]: 'Em Uso',
    [ITEM_STATUS.MANUTENCAO]: 'Manutenção'
  }
  return labels[status] || status
}

export default {
  ITEM_STATUS,
  canTransition,
  registerItem,
  matchItemToRequester,
  startTransit,
  confirmDelivery,
  getStatusBadge,
  getStatusLabel
}
