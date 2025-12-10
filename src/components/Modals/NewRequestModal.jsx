import { useState } from 'react'
import { X, FileText, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, uploadImage } from '../../lib/supabase'
import { CATEGORIES } from '../../utils/constants'
import { calculatePriority, getUrgencyLabel, getUrgencyColor } from '../../utils/priorityAlgorithm'
import LoadingSpinner from '../UI/LoadingSpinner'

/**
 * Modal de Nova Solicitação
 */
const NewRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [estimatedPosition, setEstimatedPosition] = useState(null)

  const [formData, setFormData] = useState({
    category_needed: '',
    urgency_level: 2, // Média por padrão
    notes: '',
  })

  const [medicalDocFile, setMedicalDocFile] = useState(null)
  const [docPreview, setDocPreview] = useState(null)

  if (!isOpen) return null

  const handleDocChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB.')
      return
    }

    // Validar tipo (imagem ou PDF)
    const validTypes = ['image/', 'application/pdf']
    if (!validTypes.some(type => file.type.startsWith(type))) {
      setError('Arquivo deve ser uma imagem ou PDF.')
      return
    }

    setMedicalDocFile(file)
    setDocPreview(file.name)
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
      if (!formData.category_needed) {
        throw new Error('Selecione uma categoria')
      }

      let medicalDocUrl = null

      // Upload de laudo médico (opcional)
      if (medicalDocFile) {
        medicalDocUrl = await uploadImage(medicalDocFile, 'medical-documents')
      }

      // Criar solicitação
      const { data, error: insertError } = await supabase
        .from('requests')
        .insert({
          requester_id: profile.id,
          category_needed: formData.category_needed,
          urgency_level: parseInt(formData.urgency_level),
          notes: formData.notes,
          medical_document_url: medicalDocUrl,
          status: 'pendente',
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Calcular estimativa de posição na fila
      const { count } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente')
        .eq('category_needed', formData.category_needed)

      setEstimatedPosition(count || 1)
      setSuccess(true)

      // Notificar parent
      if (onSuccess) {
        onSuccess(data)
      }

      // Reset após 4 segundos
      setTimeout(() => {
        handleClose()
      }, 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      category_needed: '',
      urgency_level: 2,
      notes: '',
    })
    setMedicalDocFile(null)
    setDocPreview(null)
    setError(null)
    setSuccess(false)
    setEstimatedPosition(null)
    onClose()
  }

  // Calcular score estimado
  const estimatedScore = calculatePriority(formData.urgency_level, new Date())

  // Estado de sucesso
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 fade-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-hospital-green rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-navy mb-2">Solicitação Criada!</h2>
            <p className="text-gray-600 mb-6">
              Sua solicitação foi registrada com sucesso.
            </p>

            {/* Informações da Fila */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Posição estimada na fila:</p>
              <p className="text-3xl font-bold text-navy">#{estimatedPosition}</p>
              <p className="text-xs text-gray-500 mt-2">
                Score de prioridade: {estimatedScore}
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Você será notificado quando um item compatível estiver disponível.
            </p>

            <button onClick={handleClose} className="btn-primary w-full">
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
          <h2 className="text-xl font-bold text-navy">Solicitar Equipamento</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobiliário/Equipamento Necessário <span className="text-red-500">*</span>
            </label>
            <select
              name="category_needed"
              value={formData.category_needed}
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

          {/* Nível de Urgência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível de Urgência <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[1, 2, 3].map((level) => (
                <label
                  key={level}
                  className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.urgency_level === level
                      ? 'border-navy bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="urgency_level"
                      value={level}
                      checked={formData.urgency_level === level}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <span className="font-medium text-gray-900">
                        {getUrgencyLabel(level)}
                      </span>
                      <p className="text-xs text-gray-500">
                        Score inicial: {level * 10}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(level)}`}>
                    Nível {level}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <AlertCircle size={14} className="mr-1" />
              O score aumenta 1 ponto por dia na fila
            </p>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Detalhe sua necessidade, contexto médico, etc..."
            />
          </div>

          {/* Upload de Laudo (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Laudo Médico (opcional)
            </label>
            {!docPreview ? (
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-navy transition-colors">
                <FileText size={32} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 text-center">
                  Clique para anexar PDF ou imagem
                </p>
                <p className="text-xs text-gray-400 mt-1">Máximo 10MB</p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleDocChange}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText size={20} className="text-navy mr-2" />
                  <span className="text-sm text-gray-700">{docPreview}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMedicalDocFile(null)
                    setDocPreview(null)
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Preview do Score */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-1">Score de Prioridade Atual:</p>
            <p className="text-2xl font-bold text-navy">{estimatedScore} pontos</p>
            <p className="text-xs text-gray-600 mt-1">
              Quanto maior o score, maior a prioridade na fila
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Aviso de Escopo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-start">
            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Nota:</strong> Aceitamos diversos tipos de equipamentos de apoio.
              <br/>
              <span className="text-red-600 font-semibold">Importante:</span> Não intermediamos <strong>medicamentos</strong> ou consultas médicas.
            </p>
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitação'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewRequestModal
