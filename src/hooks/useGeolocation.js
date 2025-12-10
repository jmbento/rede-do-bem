import { useState, useEffect } from 'react'

/**
 * Hook para obter geolocalização do usuário
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const getLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )
  }

  return { location, error, loading, getLocation }
}

/**
 * Geocoding: Converter endereço em lat/lng
 * Usando OpenStreetMap Nominatim (gratuito, sem API key)
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    )
    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        success: true,
      }
    }

    return { success: false, error: 'Endereço não encontrado' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Reverse Geocoding: Converter lat/lng em endereço
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
    const data = await response.json()

    if (data && data.address) {
      return {
        address: data.display_name,
        neighborhood: data.address.suburb || data.address.neighbourhood || '',
        city: data.address.city || data.address.town || '',
        state: data.address.state_code || '',
        zipcode: data.address.postcode || '',
        success: true,
      }
    }

    return { success: false, error: 'Localização não encontrada' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Calcular distância entre dois pontos (em km)
 * Fórmula de Haversine
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance.toFixed(2)
}

export default {
  useGeolocation,
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
}
