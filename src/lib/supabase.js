import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
// IMPORTANTE: O usuário precisa criar um projeto no Supabase e adicionar as variáveis ao .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper para upload de imagens
export const uploadImage = async (file, bucket = 'items-photos') => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (error) throw error

    // Pegar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    throw error
  }
}

// Helper para obter URL assinada temporária (laudos médicos)
export const getSignedUrl = async (path, bucket = 'medical-documents') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600) // 1 hora

    if (error) throw error
    return data.signedUrl
  } catch (error) {
    console.error('Erro ao gerar URL assinada:', error)
    throw error
  }
}

export default supabase
