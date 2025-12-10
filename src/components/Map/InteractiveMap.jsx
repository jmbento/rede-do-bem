import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { obfuscateCoordinates } from '../../utils/geoObfuscation'
import { useAuth } from '../../contexts/AuthContext'

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Ícones customizados por tipo
const createCustomIcon = (color) => {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

const ICONS = {
  doador: createCustomIcon('green'),
  solicitante: createCustomIcon('red'),
  armazenador: createCustomIcon('blue'),
  distribuidor: createCustomIcon('orange'),
  admin: createCustomIcon('violet'),
  gestor: createCustomIcon('violet'),
}

/**
 * Mapa Interativo com Leaflet
 */
const InteractiveMap = ({ center = [-23.5505, -46.6333], zoom = 12, showUsers = true }) => {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (showUsers) {
      loadUsers()
    }
  }, [showUsers])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserCoordinates = (user) => {
    // Se não for admin/gestor/distribuidor, ofuscar coordenadas
    if (!profile || !['admin', 'gestor', 'distribuidor'].includes(profile.role)) {
      return obfuscateCoordinates(user.lat, user.lng, 2)
    }
    return { lat: user.lat, lng: user.lng }
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: '100%', height: '100%' }}
      className="rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {showUsers && users.map((user) => {
        const coords = getUserCoordinates(user)
        if (!coords.lat || !coords.lng) return null

        return (
          <Marker
            key={user.id}
            position={[coords.lat, coords.lng]}
            icon={ICONS[user.role]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-navy">{user.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {user.neighborhood}, {user.city}
                </p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Círculo mostrando área de atuação (se for distribuidor) */}
      {profile?.role === 'distribuidor' && profile.lat && profile.lng && (
        <Circle
          center={[profile.lat, profile.lng]}
          radius={5000} // 5km de raio
          pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.1 }}
        />
      )}
    </MapContainer>
  )
}

export default InteractiveMap
