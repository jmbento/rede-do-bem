import { useState } from 'react'
import { X, Camera, Upload, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { uploadImage } from '../../lib/supabase'
import { registerItem } from '../../utils/itemStatusFlow'
import { CATEGORIES, CONDITIONS } from '../../utils/constants'
import LoadingSpinner from '../UI/LoadingSpinner'
import QRGenerator from '../QRCode/QRGenerator'

/**
 * Modal de Nova Doação
 */
const NewDonationModal = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [createdItemId, setCreatedItemId] = useState(null)

  const [formData, setFormData] = useState({
    category: '',
    condition: '',
    description: '',
    hasQRCode: false,
  })

  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  if (!isOpen) return null

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Foto muito grande. Máximo 5MB.')
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Arquivo deve ser uma imagem.')
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError(null)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validações
      if (!photoFile) {
        throw new Error('Foto é obrigatória')
      }
      if (!formData.category) {
        throw new Error('Selecione uma categoria')
      }
      if (!formData.condition) {
        throw new Error('Selecione a condição do item')
      }

      // 1. Upload da foto
      const photoUrl = await uploadImage(photoFile, 'items-photos')

      // 2. Cadastrar item
      const result = await registerItem(
        {
          category: formData.category,
          condition: formData.condition,
          description: formData.description,
          photo_url: photoUrl,
        },
        profile.id
      )

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao cadastrar item')
      }

      // Sucesso!
      setCreatedItemId(result.data.id)
      setSuccess(true)

      // Notificar parent component
      if (onSuccess) {
        onSuccess(result.data)
      }

      // Reset após 3 segundos
      setTimeout(() => {
        handleClose()
      }, 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      category: '',
      condition: '',
      description: '',
      hasQRCode: false,
    })
    setPhotoFile(null)
    setPhotoPreview(null)
    setError(null)
    setSuccess(false)
    setCreatedItemId(null)
    onClose()
  }

  // Estado de sucesso
  if (success && createdItemId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 fade-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-hospital-green rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-navy mb-2">Doação Cadastrada!</h2>
            <p className="text-gray-600 mb-6">
              Seu item foi cadastrado com sucesso e já está disponível para matching.
            </p>

            {/* QR Code */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">QR Code do Item:</p>
              <QRGenerator itemId={createdItemId} size={180} />
            </div>

            <button
              onClick={handleClose}
              className="btn-primary w-full"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold text-navy">Nova Doação</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Upload de Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto do Item <span className="text-red-500">*</span>
            </label>
            
            {!photoPreview ? (
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-navy transition-colors">
                <Camera size={48} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 text-center">
                  Toque para fotografar ou escolher da galeria
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Mobiliário/Equipamento <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Selecione o item...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Condição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado do Item <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {CONDITIONS.map((cond) => (
                <label
                  key={cond.value}
                  className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-navy transition-colors"
                >
                  <input
                    type="radio"
                    name="condition"
                    value={cond.value}
                    checked={formData.condition === cond.value}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <span className="text-gray-700">{cond.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Descrição (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Ex: acompanha manual, precisa de bateria nova..."
            />
          </div>

          {/* Toggle QR Code */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Já tenho etiqueta QR?</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="hasQRCode"
                checked={formData.hasQRCode}
                onChange={(e) =>
                  setFormData({ ...formData, hasQRCode: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy"></div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Cadastrando...
              </>
            ) : (
              <>
                <Upload size={20} className="mr-2" />
                Cadastrar Doação
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewDonationModal
