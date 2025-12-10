import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BarChart3, Users, Clock, AlertTriangle, TrendingUp, Package } from 'lucide-react'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import StatusBadge from '../components/UI/StatusBadge'
import { getCategoryLabel } from '../utils/constants'

const AdminPanel = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Dados simulados para KPIs (serão substituídos por dados reais)
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalItems: 0,
    avgWaitTime: 0,
    itemsInUse: 0,
    criticalRequests: 0
  })

  const [volunteers, setVolunteers] = useState([])
  const [priorityQueue, setPriorityQueue] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 1. Carregar Stats Gerais
      const { count: totalRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true })
      const { count: totalItems } = await supabase.from('items').select('*', { count: 'exact', head: true })
      const { count: itemsInUse } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', 'em_uso')
      
      // Simulação de cálculo de tempo médio (em um app real, faríamos uma query mais complexa ou edge function)
      const avgWaitTime = 4.5 // dias

      // 2. Carregar Fila de Prioridade (Pendentes)
      const { data: queueData } = await supabase
        .from('requests')
        .select(`
          *,
          requester:users(name)
        `)
        .eq('status', 'pendente')
        .order('urgency_level', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10)

      // 3. Carregar Voluntários (Simulado por enquanto, pois não temos tabela de missões populada)
      // Em produção: query na tabela users com role 'distribuidor' ou 'armazenador' e join com missions
      const mockVolunteers = [
        { id: 1, name: 'João Silva', role: 'Distribuidor', missions: 12, rating: 4.8 },
        { id: 2, name: 'Maria Santos', role: 'Armazenador', missions: 45, rating: 5.0 },
        { id: 3, name: 'Pedro Costa', role: 'Distribuidor', missions: 8, rating: 4.5 },
      ]

      setStats({
        totalRequests: totalRequests || 0,
        totalItems: totalItems || 0,
        avgWaitTime,
        itemsInUse: itemsInUse || 0,
        criticalRequests: queueData?.filter(r => r.urgency_level === 3).length || 0
      })

      setPriorityQueue(queueData || [])
      setVolunteers(mockVolunteers)

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="xl" /></div>

  return (
    <div className="min-h-screen bg-gray-light pb-24">
      {/* Header */}
      <div className="bg-navy text-white p-6 pb-12">
        <h1 className="text-2xl font-bold">Painel de Gestão</h1>
        <p className="text-blue-200">Visão geral da Rede do Bem</p>
      </div>

      {/* Conteúdo Principal - Sobrepondo o Header */}
      <div className="px-6 -mt-8">
        
        {/* Tabs de Navegação */}
        <div className="flex bg-white rounded-lg shadow-sm p-1 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === 'overview' ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === 'queue' ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Fila de Prioridades
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === 'team' ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Equipe e Voluntários
          </button>
        </div>

        {/* Tab: Visão Geral */}
        {activeTab === 'overview' && (
          <div className="space-y-6 fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <TrendingUp size={18} />
                  <span className="text-xs font-semibold uppercase">Demanda vs Acervo</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-navy">{stats.totalRequests}</span>
                  <span className="text-sm text-gray-400 mb-1">pedidos</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full" 
                    style={{ width: `${(stats.totalItems / (stats.totalRequests || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{stats.totalItems} itens no acervo</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Clock size={18} />
                  <span className="text-xs font-semibold uppercase">Tempo de Espera</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-orange-500">{stats.avgWaitTime}</span>
                  <span className="text-sm text-gray-400 mb-1">dias</span>
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <TrendingUp size={12} className="mr-1" /> -12% vs mês anterior
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Package size={18} />
                  <span className="text-xs font-semibold uppercase">Em Uso</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-hospital-green">{stats.itemsInUse}</span>
                  <span className="text-sm text-gray-400 mb-1">itens</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Taxa de giro alta</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <AlertTriangle size={18} />
                  <span className="text-xs font-semibold uppercase">Casos Críticos</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-red-500">{stats.criticalRequests}</span>
                  <span className="text-sm text-gray-400 mb-1">urgentes</span>
                </div>
                <p className="text-xs text-red-400 mt-2">Requer atenção imediata</p>
              </div>
            </div>

            {/* Gráfico Simples (Placeholder para Chart.js futuro) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-navy mb-4">Evolução Mensal</h3>
              <div className="h-40 flex items-end justify-between gap-2">
                {[40, 65, 45, 80, 55, 90].map((h, i) => (
                  <div key={i} className="w-full bg-blue-50 rounded-t-lg relative group">
                    <div 
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all duration-500 group-hover:bg-navy"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Fila de Prioridades */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden fade-in">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-navy">Fila de Espera Ativa</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {priorityQueue.map((req, idx) => (
                <div key={req.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">#{idx + 1}</span>
                      <span className="font-medium text-navy">{getCategoryLabel(req.category_needed)}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full 
                      ${req.urgency_level === 3 ? 'bg-red-100 text-red-700' : 
                        req.urgency_level === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      Urgência {req.urgency_level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Solicitante: {req.requester?.name || 'Anônimo'}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(req.created_at).toLocaleDateString()}</span>
                    <span>Score: {((req.urgency_level * 10) + Math.floor((new Date() - new Date(req.created_at)) / (86400000)))}</span>
                  </div>
                </div>
              ))}
              {priorityQueue.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Nenhuma solicitação pendente.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Equipe */}
        {activeTab === 'team' && (
          <div className="space-y-4 fade-in">
            {volunteers.map((vol) => (
              <div key={vol.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {vol.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy">{vol.name}</h4>
                    <p className="text-xs text-gray-500">{vol.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-yellow-500 font-bold">
                    <span>★</span> {vol.rating}
                  </div>
                  <p className="text-xs text-gray-400">{vol.missions} missões</p>
                </div>
              </div>
            ))}
            
            <button className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all">
              + Convidar Novo Voluntário
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminPanel
