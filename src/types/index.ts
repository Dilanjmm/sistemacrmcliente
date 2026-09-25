export type Role = 'admin' | 'vendedor' | 'consulta'

export interface Profile {
  id: string
  full_name: string
  role: Role
  sucursal_id: string | null
  activo: boolean
  created_at: string
}

export interface Sucursal {
  id: string
  nombre: string
  direccion: string | null
  activo: boolean
}

export interface Servicio {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface TipoCita {
  id: string
  nombre: string
  activo: boolean
}

export interface MotivoRechazo {
  id: string
  nombre: string
  activo: boolean
}

export type EstadoServicioNegociado =
  | 'nuevo' | 'en_seguimiento' | 'en_negociacion' | 'interesado'
  | 'pendiente_decision' | 'aceptado' | 'rechazado'

export interface Prospecto {
  id: string
  codigo: string
  sucursal_id: string
  tipo: 'persona' | 'empresa'
  nombre_contacto: string
  empresa: string | null
  telefono: string | null
  whatsapp: string | null
  email: string | null
  direccion: string | null
  persona_contacto: string | null
  cargo_contacto: string | null
  observaciones: string | null
  estado_comercial: string
  vendedor_id: string
  eliminado: boolean
  created_at: string
}

export interface ProspectoServicio {
  id: string
  prospecto_id: string
  servicio_id: string
  vendedor_id: string
  precio_inicial: number
  precio_actual: number
  fecha_propuesta: string
  estado: EstadoServicioNegociado
  observaciones: string | null
  eliminado: boolean
  created_at: string
}

export interface HistorialPrecio {
  id: string
  prospecto_servicio_id: string
  precio_anterior: number
  precio_nuevo: number
  fecha_cambio: string
  usuario_id: string
  motivo: string
  observaciones: string | null
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'realizada' | 'cancelada' | 'reprogramada' | 'no_asistio'

export interface Cita {
  id: string
  prospecto_id: string
  prospecto_servicio_id: string | null
  sucursal_id: string
  vendedor_id: string
  fecha: string
  hora: string
  tipo_cita_id: string | null
  modalidad: 'presencial' | 'virtual' | 'telefonica'
  lugar: string | null
  motivo: string | null
  observaciones: string | null
  estado: EstadoCita
  eliminado: boolean
  created_at: string
}

export type ResultadoCitaTipo =
  | 'interesado' | 'solicita_nueva_propuesta' | 'solicita_cambio_precio' | 'necesita_consultar'
  | 'requiere_nueva_reunion' | 'acepta' | 'rechaza' | 'no_asistio' | 'otro'

export interface ResultadoCita {
  id: string
  cita_id: string
  resultado: ResultadoCitaTipo
  observaciones: string
  proximo_seguimiento: string | null
  registrado_por: string
  created_at: string
}

export interface Rechazo {
  id: string
  prospecto_servicio_id: string
  motivo_rechazo_id: string
  fecha_rechazo: string
  observaciones: string | null
  usuario_id: string
}

export interface Cliente {
  id: string
  prospecto_id: string
  sucursal_id: string
  razon_social: string
  nit: string
  telefono_empresa: string | null
  email_empresa: string | null
  direccion_empresa: string | null
  contacto_nombre: string
  contacto_cargo: string | null
  contacto_telefono: string | null
  contacto_whatsapp: string | null
  contacto_email: string | null
  fecha_conversion: string
}

export interface Documento {
  id: string
  prospecto_id: string | null
  prospecto_servicio_id: string | null
  cita_id: string | null
  cliente_id: string | null
  storage_path: string
  nombre_archivo: string
  tamano_bytes: number | null
  subido_por: string
  eliminado: boolean
  created_at: string
}

export const ESTADO_SERVICIO_LABELS: Record<EstadoServicioNegociado, string> = {
  nuevo: 'Nuevo',
  en_seguimiento: 'En seguimiento',
  en_negociacion: 'En negociación',
  interesado: 'Interesado',
  pendiente_decision: 'Pendiente de decisión',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
}

export const ESTADO_CITA_LABELS: Record<EstadoCita, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reprogramada: 'Reprogramada',
  no_asistio: 'No asistió',
}

export const RESULTADO_CITA_LABELS: Record<ResultadoCitaTipo, string> = {
  interesado: 'Interesado',
  solicita_nueva_propuesta: 'Solicita nueva propuesta',
  solicita_cambio_precio: 'Solicita cambio de precio',
  necesita_consultar: 'Necesita consultar',
  requiere_nueva_reunion: 'Requiere nueva reunión',
  acepta: 'Acepta servicio',
  rechaza: 'Rechaza servicio',
  no_asistio: 'No asistió',
  otro: 'Otro',
}
