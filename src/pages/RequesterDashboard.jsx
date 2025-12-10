import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getCategoryLabel, getCategoryIcon } from '../utils/constants'
import { calculatePriority, getUrgencyLabel, getUrgencyColor } from '../utils/priorityAlgorithm'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import NewRequestModal from '../components/Modals/NewRequestModal'
import { Clock, AlertCircle, Package, CheckCircle } from 'lucide-react'

/**
 * Dashboard do Solicitante
 */
const RequesterDashboard = () => {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [selectedRequestForAgreement, setSelectedRequestForAgreement] = useState(null)
  const [queuePositions, setQueuePositions] = useState({})

  const loadRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('requester_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])

      // Calcular posição na fila para cada request pendente
      for (const request of data || []) {
        if (request.status === 'pendente') {
          await calculateQueuePosition(request)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (profile) {
      loadRequests()
    }
  }, [profile, loadRequests])

  const calculateQueuePosition = async (request) => {
    try {
      // Buscar todas as requests da mesma categoria
      const { data: allRequests } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'pendente')
        .eq('category_needed', request.category_needed)

      if (!allRequests) return

      // Calcular score de cada uma e ordenar
      const requestsWithScore = allRequests.map(r => ({
        ...r,
        score: calculatePriority(r.urgency_level, r.created_at)
      })).sort((a, b) => b.score - a.score)

      // Encontrar posição da request atual
      const position = requestsWithScore.findIndex(r => r.id === request.id) + 1

      setQueuePositions(prev => ({
        ...prev,
        [request.id]: {
          position,
          total: requestsWithScore.length,
          score: calculatePriority(request.urgency_level, request.created_at)
        }
      }))
    } catch (error) {
      console.error('Erro ao calcular posição:', error)
    }
  }

  const handleNewRequest = () => {
    loadRequests()
  }

  const initiateReceiveItem = (request) => {
    setSelectedRequestForAgreement(request)
    setShowAgreementModal(true)
  }

  const handleConfirmAgreement = async () => {
    if (!selectedRequestForAgreement) return

    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: 'atendido',
          // Em um cenário real, salvaríamos o timestamp do aceite do contrato aqui ou em uma tabela separada
          // agreement_accepted_at: new Date().toISOString() 
        })
        .eq('id', selectedRequestForAgreement.id)

      if (error) throw error
      
      loadRequests()
      setSelectedRequestForAgreement(null)
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error)
    }
  }

  const RequestCard = ({ request }) => {
    const queueInfo = queuePositions[request.id]
    const daysWaiting = Math.floor(
      (new Date() - new Date(request.created_at)) / (1000 * 60 * 60 * 24)
    )

    return (
      <div className="card-hospital fade-in">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {getCategoryIcon(request.category_needed)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {getCategoryLabel(request.category_needed)}
              </h3>
              <p className="text-sm text-gray-500">
                {getUrgencyLabel(request.urgency_level)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {request.status === 'pendente' && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
              Na Fila
            </span>
          )}
          {request.status === 'atendido' && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle size={14} />
              Atendido
            </span>
          )}
          {request.status === 'cancelado' && (
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
              Cancelado
            </span>
          )}
        </div>

        {/* Informações da Fila (apenas para pendentes) */}
        {request.status === 'pendente' && queueInfo && (
          <>
            <div className="bg-blue-50 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Posição na Fila:</span>
                <span className="text-2xl font-bold text-navy">
                  #{queueInfo.position}
                </span>
              </div>
              
              {/* Barra de Progresso */}
              <div className="progress-bar mb-2">
                <div
                  className="progress-bar-fill bg-navy"
                  style={{
                    width: `${((queueInfo.total - queueInfo.position + 1) / queueInfo.total) * 100}%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{queueInfo.total} solicitações na fila</span>
                <span className="font-medium">Score: {queueInfo.score}</span>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Clock size={14} />
                  <span className="text-xs">Tempo de Espera</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {daysWaiting} {daysWaiting === 1 ? 'dia' : 'dias'}
                </p>
              </div>

              <div className="bg-gray-50 rounded p-2">
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <AlertCircle size={14} />
                  <span className="text-xs">Urgência</span>
                </div>
                <p className={`text-sm font-semibold ${getUrgencyColor(request.urgency_level)}`}>
                  {getUrgencyLabel(request.urgency_level)}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle size={12} />
              Seu score aumenta 1 ponto por dia
            </p>
          </>
        )}

        {/* Notas */}
        {request.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{request.notes}</p>
          </div>
        )}

        {/* Botões de Ação */}
        {request.status === 'pendente' && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => initiateReceiveItem(request)}
              className="btn-primary flex-1 text-sm py-2"
            >
              Recebi o Item
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  // Estado vazio
  if (requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🏥</div>
          <h2 className="text-2xl font-bold text-navy mb-2">
            Precisa de Equipamento?
          </h2>
          <p className="text-gray-600 mb-6">
            Solicite o equipamento hospitalar que você precisa. Nossa fila prioriza por urgência e tempo de espera.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Package size={20} />
            Solicitar Equipamento
          </button>
        </div>

        <NewRequestModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleNewRequest}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-navy">
          Olá, {profile?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Suas Solicitações</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'pendente').length}
            </p>
            <p className="text-xs text-gray-600">Pendentes</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-hospital-green">
              {requests.filter(r => r.status === 'atendido').length}
            </p>
            <p className="text-xs text-gray-600">Atendidas</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-600">
              {requests.length}
            </p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Minhas Solicitações</h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-navy font-semibold text-sm hover:text-blue-900"
          >
            + Nova Solicitação
          </button>
        </div>

        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      </div>

      {/* Modal de Nova Solicitação */}
      <NewRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleNewRequest}
      />

      {/* Modal de Termo de Bons Cuidados */}
      <CareAgreementModal
        isOpen={showAgreementModal}
        onClose={() => {
          setShowAgreementModal(false)
          setSelectedRequestForAgreement(null)
        }}
        onConfirm={handleConfirmAgreement}
        itemName={selectedRequestForAgreement ? getCategoryLabel(selectedRequestForAgreement.category_needed) : ''}
      />
    </div>
  )
}

export default RequesterDashboard
