import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Badge from '../../components/Badge'
import DocumentosPanel from '../../components/DocumentosPanel'
import {
  Cita, EstadoCita, ESTADO_CITA_LABELS, Prospecto, ResultadoCita, ResultadoCitaTipo, RESULTADO_CITA_LABELS,
} from '../../types'

export default function CitaDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [cita, setCita] = useState<Cita | null>(null)
  const [prospecto, setProspecto] = useState<Prospecto | null>(null)
  const [resultado, setResultado] = useState<ResultadoCita | null>(null)

  const [resultadoForm, setResultadoForm] = useState<ResultadoCitaTipo>('interesado')
  const [obsResultado, setObsResultado] = useState('')
  const [proximoSeg, setProximoSeg] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (id) load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    if (!id) return
    const { data: c } = await supabase.from('citas').select('*').eq('id', id).single()
    setCita(c as Cita)
    if (c) {
      const { data: p } = await supabase.from('prospectos').select('*').eq('id', c.prospecto_id).single()
      setProspecto(p as Prospecto)
    }
    const { data: r } = await supabase.from('resultados_cita').select('*').eq('cita_id', id).maybeSingle()
    setResultado(r as ResultadoCita | null)
  }

  async function cambiarEstadoCita(estado: EstadoCita) {
    await supabase.from('citas').update({ estado }).eq('id', id)
    load()
  }

  async function registrarResultado() {
    setError(null)
    if (!obsResultado.trim()) {
      setError('Las observaciones son obligatorias.')
      return
    }
    const { error } = await supabase.from('resultados_cita').insert({
      cita_id: id,
      resultado: resultadoForm,
      observaciones: obsResultado,
      proximo_seguimiento: proximoSeg || null,
      registrado_por: profile?.id,
    })
    if (error) { setError(error.message); return }
    await supabase.from('citas').update({ estado: 'realizada' }).eq('id', id)
    load()
  }

  if (!cita || !prospecto) return <p className="muted">Cargando...</p>

  const canEdit = profile?.role === 'admin' || profile?.id === cita.vendedor_id

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cita · {cita.fecha} {cita.hora}</h1>
          <p>
            <Link to={`/prospectos/${prospecto.id}`}>{prospecto.empresa || prospecto.nombre_contacto}</Link>
          </p>
        </div>
        <Badge value={cita.estado} label={ESTADO_CITA_LABELS[cita.estado]} />
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Detalle</div>
          <p><strong>Modalidad:</strong> {cita.modalidad}</p>
          <p><strong>Lugar:</strong> {cita.lugar || '—'}</p>
          <p><strong>Motivo:</strong> {cita.motivo || '—'}</p>
          <p><strong>Observaciones:</strong> {cita.observaciones || '—'}</p>

          {canEdit && cita.estado !== 'realizada' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <button className="btn secondary small" onClick={() => cambiarEstadoCita('confirmada')}>Confirmar</button>
              <button className="btn secondary small" onClick={() => cambiarEstadoCita('reprogramada')}>Reprogramar</button>
              <button className="btn secondary small" onClick={() => cambiarEstadoCita('cancelada')}>Cancelar</button>
              <button className="btn secondary small" onClick={() => cambiarEstadoCita('no_asistio')}>No asistió</button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Resultado de la cita</div>
          {resultado ? (
            <div>
              <p><strong>Resultado:</strong> {RESULTADO_CITA_LABELS[resultado.resultado]}</p>
              <p><strong>Observaciones:</strong> {resultado.observaciones}</p>
              {resultado.proximo_seguimiento && <p><strong>Próximo seguimiento:</strong> {resultado.proximo_seguimiento}</p>}
            </div>
          ) : canEdit ? (
            <div>
              <div className="form-group">
                <label>Resultado *</label>
                <select value={resultadoForm} onChange={(e) => setResultadoForm(e.target.value as ResultadoCitaTipo)}>
                  {Object.entries(RESULTADO_CITA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Observaciones *</label>
                <textarea rows={3} value={obsResultado} onChange={(e) => setObsResultado(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Programar próximo seguimiento (opcional)</label>
                <input type="date" value={proximoSeg} onChange={(e) => setProximoSeg(e.target.value)} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <button className="btn small" onClick={registrarResultado}>Guardar resultado</button>
            </div>
          ) : (
            <p className="muted">Aún no se registra resultado.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>Documentos de la cita</div>
        <DocumentosPanel citaId={cita.id} />
      </div>
    </div>
  )
}
