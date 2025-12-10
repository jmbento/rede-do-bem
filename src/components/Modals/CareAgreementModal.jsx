import { useState } from 'react'
import { X, FileText, CheckCircle, Shield, AlertTriangle } from 'lucide-react'

const CareAgreementModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (!accepted) return
    setLoading(true)
    // Simular delay de processamento ou chamada real se necessário aqui
    // A chamada real de update no banco será feita pelo pai (onConfirm)
    await onConfirm()
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy">Termo de Bons Cuidados</h2>
              <p className="text-sm text-gray-500">Contrato de Responsabilidade</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Item Info */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800">
              Você está recebendo o item: <span className="font-bold">{itemName || 'Equipamento Hospitalar'}</span>
            </p>
          </div>

          {/* Texto Legal Simplificado */}
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>
              Ao aceitar este equipamento, eu me comprometo a zelar pela sua integridade e bom funcionamento, reconhecendo que ele é um bem compartilhado que servirá a outras pessoas no futuro.
            </p>
            
            <h3 className="font-bold text-navy flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              Meus Compromissos:
            </h3>
            
            <ul className="space-y-3 pl-2">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                <span><strong>Higienização:</strong> Manter o equipamento limpo e higienizado conforme orientações básicas de saúde.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                <span><strong>Uso Correto:</strong> Utilizar o equipamento apenas para a finalidade a que se destina e por quem realmente necessita.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                <span><strong>Devolução:</strong> Informar imediatamente à Rede do Bem quando o equipamento não for mais necessário, para que possa ser recolhido e doado a outro paciente.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                <span><strong>Danos:</strong> Comunicar qualquer dano ou avaria acidental para avaliarmos a necessidade de reparo.</span>
              </li>
            </ul>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-3 mt-4">
              <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                Este é um contrato digital de confiança. O não cumprimento destas regras pode impactar sua prioridade em solicitações futuras.
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Action */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <label className="flex items-start gap-3 cursor-pointer mb-6 group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-hospital-green peer-checked:border-hospital-green transition-colors"></div>
              <CheckCircle size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 top-0.5 left-0.5 pointer-events-none" />
            </div>
            <span className="text-sm text-gray-700 select-none group-hover:text-navy transition-colors">
              Li, compreendi e concordo com os termos de responsabilidade e bons cuidados descritos acima.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-colors flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!accepted || loading}
              className={`
                flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
                ${accepted && !loading 
                  ? 'bg-hospital-green hover:bg-green-600 hover:shadow-xl transform hover:-translate-y-0.5' 
                  : 'bg-gray-300 cursor-not-allowed'}
              `}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Assinar e Receber
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CareAgreementModal
