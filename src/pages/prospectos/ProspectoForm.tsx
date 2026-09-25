import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Sucursal } from '../../types'

export default function ProspectoForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [form, setForm] = useState({
    tipo: 'persona',
    nombre_contacto: '',
    empresa: '',
    telefono: '',
    whatsapp: '',
    email: '',
    direccion: '',
    persona_contacto: '',
    cargo_contacto: '',
    observaciones: '',
    estado_comercial: 'activo',
    sucursal_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('sucursales').select('*').eq('activo', true).then(({ data }) => {
      setSucursales((data as Sucursal[]) ?? [])
      if (!editing && profile?.sucursal_id) {
        setForm((f) => ({ ...f, sucursal_id: profile.sucursal_id as string }))
      }
    })
    if (editing && id) {
      supabase.from('prospectos').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({
            tipo: data.tipo,
            nombre_contacto: data.nombre_contacto,
            empresa: data.empresa || '',
            telefono: data.telefono || '',
            whatsapp: data.whatsapp || '',
            email: data.email || '',
            direccion: data.direccion || '',
            persona_contacto: data.persona_contacto || '',
            cargo_contacto: data.cargo_contacto || '',
            observaciones: data.observaciones || '',
            estado_comercial: data.estado_comercial,
            sucursal_id: data.sucursal_id,
          })
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.nombre_contacto.trim()) {
      setError('El nombre o nombre de contacto es obligatorio.')
      return
    }
    if (!form.sucursal_id) {
      setError('Selecciona una sucursal.')
      return
    }
    setLoading(true)

    if (editing && id) {
      const { error } = await supabase.from('prospectos').update(form).eq('id', id)
      setLoading(false)
      if (error) { setError(error.message); return }
      navigate(`/prospectos/${id}`)
    } else {
      const { data, error } = await supabase
        .from('prospectos')
        .insert({ ...form, vendedor_id: profile?.id })
        .select()
        .single()
      setLoading(false)
      if (error) { setError(error.message); return }
      navigate(`/prospectos/${data.id}`)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{editing ? 'Editar prospecto' : 'Nuevo prospecto'}</h1>
          <p>Puedes registrar solo la información básica y completarla luego.</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de prospecto</label>
            <select value={form.tipo} onChange={(e) => update('tipo', e.target.value)}>
              <option value="persona">Persona</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sucursal</label>
            <select value={form.sucursal_id} onChange={(e) => update('sucursal_id', e.target.value)} required>
              <option value="">Selecciona...</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Nombre o nombre de contacto *</label>
          <input value={form.nombre_contacto} onChange={(e) => update('nombre_contacto', e.target.value)} required />
        </div>

        {form.tipo === 'empresa' && (
          <div className="form-group">
            <label>Empresa</label>
            <input value={form.empresa} onChange={(e) => update('empresa', e.target.value)} />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Teléfono</label>
            <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Correo electrónico</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input value={form.direccion} onChange={(e) => update('direccion', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Persona de contacto</label>
            <input value={form.persona_contacto} onChange={(e) => update('persona_contacto', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Cargo del contacto</label>
            <input value={form.cargo_contacto} onChange={(e) => update('cargo_contacto', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Estado comercial</label>
          <select value={form.estado_comercial} onChange={(e) => update('estado_comercial', e.target.value)}>
            <option value="activo">Activo</option>
            <option value="en_negociacion">En negociación</option>
            <option value="cliente">Cliente</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        <div className="form-group">
          <label>Observaciones</label>
          <textarea rows={3} value={form.observaciones} onChange={(e) => update('observaciones', e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="btn secondary" type="button" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
