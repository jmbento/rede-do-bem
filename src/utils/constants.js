/**
 * Categorias de Equipamentos Hospitalares
 */

export const CATEGORIES = [
  { value: 'cadeira_rodas', label: 'Cadeira de Rodas', icon: '♿' },
  { value: 'muleta', label: 'Muletas', icon: '🦯' },
  { value: 'andador', label: 'Andador', icon: '🚶' },
  { value: 'cama_hospitalar', label: 'Cama Hospitalar', icon: '🛏️' },
  { value: 'cadeira_banho', label: 'Cadeira de Banho', icon: '🚿' },
  { value: 'colchao_caixa_ovo', label: 'Colchão Pneumático/Caixa de Ovo', icon: '🛏️' },
  { value: 'suporte_soro', label: 'Suporte de Soro', icon: '💉' },
  { value: 'papagaio_comadre', label: 'Papagaio/Comadre', icon: '🚽' },
  { value: 'tipoia_imobilizador', label: 'Tipóia/Imobilizador', icon: '🤕' },
  { value: 'outros', label: 'Outros / Diversos', icon: '📦' }
]

// Condições do item
export const CONDITIONS = [
  { value: 'novo', label: '✨ Novo - Nunca usado' },
  { value: 'bom', label: '👍 Bom Estado - Funcionando perfeitamente' },
  { value: 'precisa_reparo', label: '🔧 Precisa Reparo - Requer manutenção' },
]

/**
 * Funções auxiliares para obter informações de categoria
 */
export const getCategoryLabel = (categoryValue) => {
  const category = CATEGORIES.find(c => c.value === categoryValue)
  return category ? category.label : categoryValue
}

export const getCategoryIcon = (categoryValue) => {
  const category = CATEGORIES.find(c => c.value === categoryValue)
  return category ? category.icon : '📦'
}

export const getConditionLabel = (value) => {
  const condition = CONDITIONS.find(c => c.value === value)
  return condition ? condition.label : value
}

export default {
  CATEGORIES,
  CONDITIONS,
  getCategoryLabel,
  getCategoryIcon,
  getConditionLabel
}
