import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MapPin, Navigation, Calendar, Package, Phone, CheckCircle } from 'lucide-react'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import StatusBadge from '../components/UI/StatusBadge'
import ScheduleMatch from '../components/Missions/ScheduleMatch'
import { getCategoryLabel } from '../utils/constants'

const DriverMissions = () => {
  const { profile } = useAuth()
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available') // available, my_missions
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedMission, setSelectedMission] = useState(null)

  useEffect(() => {
    loadMissions()
  }, [activeTab])

  const loadMissions = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('requests') // Usando requests como base para missões simplificadas
        .select(`
          *,
          requester:users(name, phone)
        `)
      
      if (activeTab === 'available') {
        // Missões disponíveis: requests pendentes sem voluntário atribuído
        // (Na implementação real, teríamos uma tabela 'missions', aqui simplificamos usando requests)
        query = query.eq('status', 'pendente')
      } else {
        // Minhas missões: requests que eu aceitei (mockado por enquanto)
        query = query.eq('status', 'em_transito') // Simplificação
      }

      const { data, error } = await query

      if (error) throw error
      setMissions(data || [])
    } catch (error) {
      console.error('Erro ao carregar missões:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptMission = (mission) => {
    setSelectedMission(mission)
    setShowScheduleModal(true)
  }

  const handleScheduleConfirm = async (scheduleData) => {
    try {
      // 1. Atualizar status da request/missão
      // 2. Salvar agendamento
      console.log('Agendado para:', scheduleData)
      
      // Simulação de update
      const { error } = await supabase
        .from('requests')
        .update({ status: 'em_transito' }) // Simulando que aceitou e já está em processo
        .eq('id', selectedMission.id)

      if (error) throw error

      setShowScheduleModal(false)
      setSelectedMission(null)
      setActiveTab('my_missions') // Mudar para aba de minhas missões
      loadMissions()
      
      alert('Missão aceita e agendada com sucesso!')
    } catch (error) {
      console.error('Erro ao aceitar missão:', error)
    }
  }

  const openWaze = (address) => {
    // Link genérico para Waze (em produção usaria coordenadas reais)
    window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}`, '_blank')
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="xl" /></div>

  return (
    <div className="min-h-screen bg-gray-light pb-24">
      {/* Header */}
      <div className="bg-navy p-6 pb-12 text-white">
        <h1 className="text-2xl font-bold">Central de Missões</h1>
        <p className="text-blue-200">Logística e Distribuição</p>
      </div>

      <div className="px-6 -mt-8">
        {/* Tabs */}
        <div className="flex bg-white rounded-lg shadow-sm p-1 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'available' ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Disponíveis
          </button>
          <button
            onClick={() => setActiveTab('my_missions')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'my_missions' ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Minhas Missões
          </button>
        </div>

        {/* Lista de Missões */}
        <div className="space-y-4">
          {missions.map((mission) => (
            <div key={mission.id} className="card-hospital fade-in">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy">{getCategoryLabel(mission.category_needed)}</h3>
                    <p className="text-xs text-gray-500">Solicitante: {mission.requester?.name}</p>
                  </div>
                </div>
                <StatusBadge status={mission.status} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0 text-red-500" />
                  <span>Destino: Rua Exemplo, 123 - Centro (Simulado)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Navigation size={16} className="text-blue-500" />
                  <span>3.5 km de distância</span>
                </div>
              </div>

              {activeTab === 'available' ? (
                <button
                  onClick={() => handleAcceptMission(mission)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Aceitar e Agendar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => openWaze('Rua Exemplo, 123')}
                    className="flex-1 py-2 rounded-lg border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 flex items-center justify-center gap-2"
                  >
                    <Navigation size={18} />
                    Abrir Waze
                  </button>
                  <button className="flex-1 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Finalizar
                  </button>
                </div>
              )}
            </div>
          ))}

          {missions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhuma missão encontrada nesta categoria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Agenda */}
      {showScheduleModal && selectedMission && (
        <ScheduleMatch
          requesterName={selectedMission.requester?.name}
          onScheduleConfirm={handleScheduleConfirm}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  )
}

export default DriverMissions
