import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente secundario, sin persistencia de sesion.
// Se usa SOLO para crear nuevos usuarios desde el panel de administracion,
// para que el admin no pierda su propia sesion al hacerlo.
export const supabaseAdminCreate = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
