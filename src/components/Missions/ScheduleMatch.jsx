import { useState } from 'react'
import { Calendar, Clock, CheckCircle, User, MapPin } from 'lucide-react'

const ScheduleMatch = ({ requesterName, requesterAvailability, onScheduleConfirm, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  // Simulação de dias disponíveis (próximos 5 dias)
  const nextDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  })

  // Simulação de slots de tempo baseados na disponibilidade do solicitante
  // Em produção, isso viria do banco de dados (campo availability do user)
  const timeSlots = [
    { id: 'morning', label: 'Manhã', time: '08:00 - 12:00' },
    { id: 'afternoon', label: 'Tarde', time: '13:00 - 18:00' },
    { id: 'night', label: 'Noite', time: '18:00 - 21:00' }
  ]

  const handleConfirm = () => {
    if (selectedDate && selectedSlot) {
      onScheduleConfirm({
        date: selectedDate,
        slot: selectedSlot
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-navy p-6 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-hospital-green" />
            Agendar Entrega
          </h2>
          <p className="text-blue-200 text-sm mt-1">
            Cruzar agenda com {requesterName}
          </p>
        </div>

        <div className="p-6">
          {/* Info do Beneficiário */}
          <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
              <User size={16} />
              <span>Preferências do Beneficiário:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Mock de preferências */}
              <span className="bg-white px-2 py-1 rounded text-xs text-gray-600 border border-blue-100">
                Segunda (Manhã)
              </span>
              <span className="bg-white px-2 py-1 rounded text-xs text-gray-600 border border-blue-100">
                Terça (Tarde)
              </span>
              <span className="bg-white px-2 py-1 rounded text-xs text-gray-600 border border-blue-100">
                Quarta (Noite)
              </span>
            </div>
          </div>

          {/* Seleção de Data */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Escolha uma Data
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {nextDays.map((date) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString()
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      flex flex-col items-center justify-center min-w-[4.5rem] p-3 rounded-xl border transition-all
                      ${isSelected 
                        ? 'bg-navy text-white border-navy shadow-md transform scale-105' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}
                    `}
                  >
                    <span className="text-xs font-medium uppercase">
                      {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-lg font-bold">
                      {date.getDate()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Seleção de Horário */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Escolha um Período
            </label>
            <div className="grid grid-cols-1 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id
                // Lógica simples de "match": destacar slots que batem com a preferência (mockado)
                const isMatch = ['afternoon', 'night'].includes(slot.id) 

                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-all
                      ${isSelected 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Clock size={18} />
                      <div className="text-left">
                        <p className="font-semibold text-sm">{slot.label}</p>
                        <p className="text-xs opacity-80">{slot.time}</p>
                      </div>
                    </div>
                    {isMatch && !isSelected && (
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Match!
                      </span>
                    )}
                    {isSelected && <CheckCircle size={18} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedSlot}
              className={`
                flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                ${selectedDate && selectedSlot 
                  ? 'bg-hospital-green hover:bg-green-600 hover:shadow-xl' 
                  : 'bg-gray-300 cursor-not-allowed'}
              `}
            >
              Confirmar Agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleMatch
