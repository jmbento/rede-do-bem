import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, HandHeart, Truck, Package } from 'lucide-react'
import LoadingSpinner from '../components/UI/LoadingSpinner'

/**
 * Tela de Onboarding/Login
 */
const Onboarding = () => {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('select') // 'select', 'login', 'signup'
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
  })

  const roleOptions = [
    {
      value: 'doador',
      label: 'Quero Doar',
      description: 'Tenho equipamentos hospitalares para doar',
      icon: Heart,
      color: 'bg-hospital-green'
    },
    {
      value: 'solicitante',
      label: 'Preciso de Ajuda',
      description: 'Preciso de equipamentos médicos',
      icon: HandHeart,
      color: 'bg-urgent-red'
    },
    {
      value: 'distribuidor',
      label: 'Sou Voluntário (Transporte)',
      description: 'Posso ajudar com logística',
      icon: Truck,
      color: 'bg-yellow-400'
    },
    {
      value: 'armazenador',
      label: 'Sou Voluntário (Armazém)',
      description: 'Tenho espaço para armazenar',
      icon: Package,
      color: 'bg-navy'
    }
  ]

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setMode('signup')
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const result = await signIn(formData.email, formData.password)
        if (!result.success) throw new Error(result.error)
        navigate('/dashboard')
      } else {
        const result = await signUp(formData.email, formData.password, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          role: selectedRole,
        })
        if (!result.success) throw new Error(result.error)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Tela de seleção de perfil
  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gray-light flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-navy mb-2">Rede do Bem</h1>
            <p className="text-gray-600">Sistema de Doação Hospitalar</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-dark mb-4">Como você quer ajudar?</h2>
            
            <div className="space-y-3">
              {roleOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => handleRoleSelect(option.value)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-navy hover:shadow-md transition-all duration-200"
                  >
                    <div className={`${option.color} p-3 rounded-full text-white`}>
                      <Icon size={24} />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-dark">{option.label}</h3>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => setMode('login')}
            className="w-full text-center text-navy font-semibold"
          >
            Já tenho uma conta
          </button>
        </div>
      </div>
    )
  }

  // Tela de Login/Cadastro
  return (
    <div className="min-h-screen bg-gray-light flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-navy mb-6">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Seu endereço completo"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? <LoadingSpinner size="sm" className="text-white" /> : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <button
                onClick={() => setMode('select')}
                className="text-navy font-semibold"
              >
                Criar nova conta
              </button>
            ) : (
              <button
                onClick={() => setMode('login')}
                className="text-navy font-semibold"
              >
                Já tenho uma conta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
