import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getCategoryLabel, getCategoryIcon } from '../utils/constants'
import { getStatusLabel, getStatusBadge } from '../utils/itemStatusFlow'
import FAB from '../components/UI/FAB'
import StatusBadge from '../components/UI/StatusBadge'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import NewDonationModal from '../components/Modals/NewDonationModal'
import QRGenerator from '../components/QRCode/QRGenerator'
import { QrCode, MapPin } from 'lucide-react'

/**
 * Dashboard do Doador
 */
const DonorDashboard = () => {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)

  // Estatísticas
  const [stats, setStats] = useState({
    totalDonations: 0,
    peopleHelped: 0,
    itemsInUse: 0,
  })

  useEffect(() => {
    if (profile) {
      loadItems()
      loadStats()
    }
  }, [profile])

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('holder_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Total de doações
      const { count: totalDonations } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('holder_id', profile.id)

      // Itens em uso (pessoas ajudadas)
      const { count: itemsInUse } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'em_uso')

      setStats({
        totalDonations: totalDonations || 0,
        peopleHelped: itemsInUse || 0,
        itemsInUse: itemsInUse || 0,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleNewDonation = (newItem) => {
    loadItems()
    loadStats()
  }

  const ItemCard = ({ item }) => (
    <div className="card-hospital fade-in">
      <div className="flex gap-4">
        {/* Foto */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={getCategoryLabel(item.category)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {getCategoryIcon(item.category)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {getCategoryLabel(item.category)}
              </h3>
              <p className="text-sm text-gray-500 capitalize">{item.condition}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setSelectedItem(item)
                setShowQRModal(true)
              }}
              className="flex items-center gap-1 text-sm text-navy hover:text-blue-900 font-medium"
            >
              <QrCode size={16} />
              Ver QR Code
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Cadastrado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <LoadingSpinner size="xl" />
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
        <p className="text-gray-600 mt-1">
          Você ajudou <span className="font-bold text-hospital-green">{stats.peopleHelped} {stats.peopleHelped === 1 ? 'pessoa' : 'pessoas'}</span>
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-navy">{stats.totalDonations}</p>
            <p className="text-xs text-gray-600">Doações</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-hospital-green">{stats.itemsInUse}</p>
            <p className="text-xs text-gray-600">Em Uso</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {items.filter(i => i.status === 'em_transito').length}
            </p>
            <p className="text-xs text-gray-600">Em Trânsito</p>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Minhas Doações</h2>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma doação ainda
            </h3>
            <p className="text-gray-600 mb-4">
              Comece doando seu primeiro equipamento hospitalar!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center"
            >
              Fazer Primeira Doação
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <FAB onClick={() => setShowModal(true)} />

      {/* Modal de Nova Doação */}
      <NewDonationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleNewDonation}
      />

      {/* Modal de QR Code */}
      {showQRModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-navy">QR Code do Item</h3>
              <button
                onClick={() => {
                  setShowQRModal(false)
                  setSelectedItem(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="text-center">
              <QRGenerator itemId={selectedItem.id} size={220} />
              <p className="text-sm text-gray-600 mt-4">
                {getCategoryLabel(selectedItem.category)}
              </p>
              <StatusBadge status={selectedItem.status} className="mt-2" />
            </div>

            <button
              onClick={() => {
                setShowQRModal(false)
                setSelectedItem(null)
              }}
              className="btn-primary w-full mt-6"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DonorDashboard
