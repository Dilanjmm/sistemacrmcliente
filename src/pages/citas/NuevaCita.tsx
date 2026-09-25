import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Prospecto, ProspectoServicio, TipoCita } from '../../types'

export default function NuevaCita() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const prospectoIdParam = params.get('prospecto') || ''

  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [serviciosDelProspecto, setServiciosDelProspecto] = useState<ProspectoServicio[]>([])
  const [tipos, setTipos] = useState<TipoCita[]>([])
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    prospecto_id: prospectoIdParam,
    prospecto_servicio_id: '',
    fecha: '',
    hora: '',
    tipo_cita_id: '',
    modalidad: 'presencial',
    lugar: '',
    motivo: '',
    observaciones: '',
  })

  useEffect(() => {
    supabase.from('prospectos').select('*').eq('eliminado', false).then(({ data }) => setProspectos((data as Prospecto[]) ?? []))
    supabase.from('tipos_cita').select('*').eq('activo', true).then(({ data }) => setTipos((data as TipoCita[]) ?? []))
  }, [])

  useEffect(() => {
    if (form.prospecto_id) {
      supabase.from('prospecto_servicios').select('*').eq('prospecto_id', form.prospecto_id).eq('eliminado', false)
        .then(({ data }) => setServiciosDelProspecto((data as ProspectoServicio[]) ?? []))
    } else {
      setServiciosDelProspecto([])
    }
  }, [form.prospecto_id])

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit() {
    setError(null)
    if (!form.prospecto_id || !form.fecha || !form.hora) {
      setError('Selecciona un prospecto, fecha y hora.')
      return
    }
    const prospecto = prospectos.find((p) => p.id === form.prospecto_id)
    const { data, error } = await supabase.from('citas').insert({
      prospecto_id: form.prospecto_id,
      prospecto_servicio_id: form.prospecto_servicio_id || null,
      sucursal_id: prospecto?.sucursal_id,
      vendedor_id: profile?.id,
      fecha: form.fecha,
      hora: form.hora,
      tipo_cita_id: form.tipo_cita_id || null,
      modalidad: form.modalidad,
      lugar: form.lugar || null,
      motivo: form.motivo || null,
      observaciones: form.observaciones || null,
    }).select().single()
    if (error) { setError(error.message); return }
    navigate(`/citas/${data.id}`)
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Agendar cita</h1><p>Cita relacionada con un prospecto y opcionalmente un servicio</p></div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="form-group">
          <label>Prospecto *</label>
          <select value={form.prospecto_id} onChange={(e) => update('prospecto_id', e.target.value)}>
            <option value="">Selecciona...</option>
            {prospectos.map((p) => <option key={p.id} value={p.id}>{p.empresa || p.nombre_contacto} ({p.codigo})</option>)}
          </select>
        </div>

        {serviciosDelProspecto.length > 0 && (
          <div className="form-group">
            <label>Servicio relacionado (opcional)</label>
            <select value={form.prospecto_servicio_id} onChange={(e) => update('prospecto_servicio_id', e.target.value)}>
              <option value="">General (sin servicio específico)</option>
              {serviciosDelProspecto.map((ps) => <option key={ps.id} value={ps.id}>{ps.estado}</option>)}
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Fecha *</label>
            <input type="date" value={form.fecha} onChange={(e) => update('fecha', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hora *</label>
            <input type="time" value={form.hora} onChange={(e) => update('hora', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo de cita</label>
            <select value={form.tipo_cita_id} onChange={(e) => update('tipo_cita_id', e.target.value)}>
              <option value="">Selecciona...</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Modalidad</label>
            <select value={form.modalidad} onChange={(e) => update('modalidad', e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="telefonica">Telefónica</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Lugar</label>
          <input value={form.lugar} onChange={(e) => update('lugar', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Motivo</label>
          <input value={form.motivo} onChange={(e) => update('motivo', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Observaciones</label>
          <textarea rows={2} value={form.observaciones} onChange={(e) => update('observaciones', e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={submit}>Guardar cita</button>
          <button className="btn secondary" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
