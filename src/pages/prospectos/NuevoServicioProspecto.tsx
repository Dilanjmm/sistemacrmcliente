import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Servicio } from '../../types'

export default function NuevoServicioProspecto({
  prospectoId, onCreated, onCancel,
}: { prospectoId: string; onCreated: () => void; onCancel: () => void }) {
  const { profile } = useAuth()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [servicioId, setServicioId] = useState('')
  const [precio, setPrecio] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('servicios').select('*').eq('activo', true).then(({ data }) => setServicios((data as Servicio[]) ?? []))
  }, [])

  async function submit() {
    setError(null)
    const p = parseFloat(precio)
    if (!servicioId || !p || p <= 0) {
      setError('Selecciona un servicio e ingresa un precio inicial válido.')
      return
    }
    const { error } = await supabase.from('prospecto_servicios').insert({
      prospecto_id: prospectoId,
      servicio_id: servicioId,
      vendedor_id: profile?.id,
      precio_inicial: p,
      precio_actual: p,
      observaciones: observaciones || null,
    })
    if (error) { setError(error.message); return }
    onCreated()
  }

  return (
    <div className="card" style={{ background: '#F2F5F2' }}>
      <div className="section-title" style={{ marginTop: 0 }}>Ofrecer nuevo servicio</div>
      <div className="form-row">
        <div className="form-group">
          <label>Servicio *</label>
          <select value={servicioId} onChange={(e) => setServicioId(e.target.value)}>
            <option value="">Selecciona...</option>
            {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Precio inicial (Bs.) *</label>
          <input type="number" min={0} value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Observaciones</label>
        <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </div>
      {error && <p className="error-text">{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn small" onClick={submit}>Guardar</button>
        <button className="btn secondary small" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}
