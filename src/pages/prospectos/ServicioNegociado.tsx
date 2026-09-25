import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Badge from '../../components/Badge'
import {
  ProspectoServicio, Servicio, HistorialPrecio, MotivoRechazo, ESTADO_SERVICIO_LABELS,
} from '../../types'

export default function ServicioNegociado({
  ps, servicio, onChange, onNeedsClientConversion,
}: {
  ps: ProspectoServicio
  servicio: Servicio | undefined
  onChange: () => void
  onNeedsClientConversion: () => void
}) {
  const { profile } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [historial, setHistorial] = useState<HistorialPrecio[]>([])
  const [motivos, setMotivos] = useState<MotivoRechazo[]>([])

  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [motivoPrecio, setMotivoPrecio] = useState('')
  const [obsPrecio, setObsPrecio] = useState('')

  const [motivoRechazoId, setMotivoRechazoId] = useState('')
  const [obsRechazo, setObsRechazo] = useState('')
  const [showRechazo, setShowRechazo] = useState(false)

  const canEdit = profile?.role === 'admin' || profile?.id === ps.vendedor_id

  useEffect(() => {
    if (expanded) loadHistorial()
    supabase.from('motivos_rechazo').select('*').eq('activo', true).then(({ data }) => setMotivos((data as MotivoRechazo[]) ?? []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  async function loadHistorial() {
    const { data } = await supabase
      .from('historial_precios')
      .select('*')
      .eq('prospecto_servicio_id', ps.id)
      .order('fecha_cambio', { ascending: false })
    setHistorial((data as HistorialPrecio[]) ?? [])
  }

  async function registrarCambioPrecio() {
    const nuevo = parseFloat(nuevoPrecio)
    if (!nuevo || nuevo <= 0 || !motivoPrecio.trim()) {
      alert('Ingresa un precio válido y el motivo del cambio.')
      return
    }
    await supabase.from('historial_precios').insert({
      prospecto_servicio_id: ps.id,
      precio_anterior: ps.precio_actual,
      precio_nuevo: nuevo,
      usuario_id: profile?.id,
      motivo: motivoPrecio,
      observaciones: obsPrecio || null,
    })
    await supabase.from('prospecto_servicios').update({ precio_actual: nuevo }).eq('id', ps.id)
    setNuevoPrecio(''); setMotivoPrecio(''); setObsPrecio('')
    loadHistorial()
    onChange()
  }

  async function cambiarEstado(estado: string) {
    await supabase.from('prospecto_servicios').update({ estado }).eq('id', ps.id)
    onChange()
    if (estado === 'aceptado') onNeedsClientConversion()
  }

  async function confirmarRechazo() {
    if (!motivoRechazoId) { alert('Selecciona un motivo de rechazo.'); return }
    await supabase.from('rechazos').insert({
      prospecto_servicio_id: ps.id,
      motivo_rechazo_id: motivoRechazoId,
      observaciones: obsRechazo || null,
      usuario_id: profile?.id,
    })
    await supabase.from('prospecto_servicios').update({ estado: 'rechazado' }).eq('id', ps.id)
    setShowRechazo(false)
    onChange()
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este servicio negociado?')) return
    await supabase.from('prospecto_servicios').update({ eliminado: true }).eq('id', ps.id)
    onChange()
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <strong>{servicio?.nombre || 'Servicio'}</strong>
          <div className="muted" style={{ fontSize: 13 }}>
            Propuesto el {ps.fecha_propuesta} · Precio actual: Bs. {Number(ps.precio_actual).toLocaleString('es-BO')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge value={ps.estado} label={ESTADO_SERVICIO_LABELS[ps.estado]} />
          <button className="btn secondary small" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Ocultar' : 'Detalle'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16 }}>
          {ps.observaciones && <p className="muted">{ps.observaciones}</p>}

          {canEdit && ps.estado !== 'aceptado' && ps.estado !== 'rechazado' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {(['en_seguimiento', 'en_negociacion', 'interesado', 'pendiente_decision'] as const).map((e) => (
                <button key={e} className="btn secondary small" onClick={() => cambiarEstado(e)}>
                  Marcar: {ESTADO_SERVICIO_LABELS[e]}
                </button>
              ))}
              <button className="btn small" onClick={() => cambiarEstado('aceptado')}>Aceptar servicio</button>
              <button className="btn danger small" onClick={() => setShowRechazo(true)}>Rechazar servicio</button>
            </div>
          )}

          {showRechazo && (
            <div className="card" style={{ background: '#FBF4F1', marginBottom: 16 }}>
              <div className="form-group">
                <label>Motivo del rechazo *</label>
                <select value={motivoRechazoId} onChange={(e) => setMotivoRechazoId(e.target.value)}>
                  <option value="">Selecciona...</option>
                  {motivos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Observaciones</label>
                <textarea rows={2} value={obsRechazo} onChange={(e) => setObsRechazo(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn danger small" onClick={confirmarRechazo}>Confirmar rechazo</button>
                <button className="btn secondary small" onClick={() => setShowRechazo(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="section-title">Historial de precios</div>
          <table>
            <thead>
              <tr><th>Fecha</th><th>Anterior</th><th>Nuevo</th><th>Motivo</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{ps.fecha_propuesta}</td>
                <td>—</td>
                <td>Bs. {Number(ps.precio_inicial).toLocaleString('es-BO')}</td>
                <td>Precio inicial</td>
              </tr>
              {historial.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.fecha_cambio).toLocaleDateString('es-BO')}</td>
                  <td>Bs. {Number(h.precio_anterior).toLocaleString('es-BO')}</td>
                  <td>Bs. {Number(h.precio_nuevo).toLocaleString('es-BO')}</td>
                  <td>{h.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {canEdit && ps.estado !== 'aceptado' && ps.estado !== 'rechazado' && (
            <div style={{ marginTop: 14 }}>
              <div className="section-title">Registrar cambio de precio</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio nuevo (Bs.)</label>
                  <input type="number" min={0} value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Motivo *</label>
                  <input value={motivoPrecio} onChange={(e) => setMotivoPrecio(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Observaciones</label>
                <input value={obsPrecio} onChange={(e) => setObsPrecio(e.target.value)} />
              </div>
              <button className="btn secondary small" onClick={registrarCambioPrecio}>Guardar cambio de precio</button>
            </div>
          )}

          {canEdit && (
            <div style={{ marginTop: 16 }}>
              <button className="btn secondary small" onClick={eliminar}>Eliminar este servicio negociado</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
