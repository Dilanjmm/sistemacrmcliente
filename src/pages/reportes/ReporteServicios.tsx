import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/Badge'
import { ESTADO_SERVICIO_LABELS, ProspectoServicio, Servicio, Prospecto } from '../../types'

export default function ReporteServicios() {
  const [rows, setRows] = useState<ProspectoServicio[]>([])
  const [catalogo, setCatalogo] = useState<Servicio[]>([])
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [estado, setEstado] = useState('')

  useEffect(() => {
    supabase.from('prospecto_servicios').select('*').eq('eliminado', false).order('created_at', { ascending: false })
      .then(({ data }) => setRows((data as ProspectoServicio[]) ?? []))
    supabase.from('servicios').select('*').then(({ data }) => setCatalogo((data as Servicio[]) ?? []))
    supabase.from('prospectos').select('*').then(({ data }) => setProspectos((data as Prospecto[]) ?? []))
  }, [])

  const filtered = rows.filter((r) => !estado || r.estado === estado)

  return (
    <div>
      <div className="page-header"><div><h1>Reporte de servicios negociados</h1><p>Total: {filtered.length}</p></div></div>
      <div className="toolbar">
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(ESTADO_SERVICIO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Prospecto</th><th>Servicio</th><th>Precio actual</th><th>Estado</th></tr></thead>
          <tbody>
            {filtered.map((s) => {
              const p = prospectos.find((x) => x.id === s.prospecto_id)
              return (
                <tr key={s.id}>
                  <td>{p?.empresa || p?.nombre_contacto || '—'}</td>
                  <td>{catalogo.find((c) => c.id === s.servicio_id)?.nombre}</td>
                  <td>Bs. {Number(s.precio_actual).toLocaleString('es-BO')}</td>
                  <td><Badge value={s.estado} label={ESTADO_SERVICIO_LABELS[s.estado]} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
