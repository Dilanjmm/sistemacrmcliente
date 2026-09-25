import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/Badge'
import { ESTADO_CITA_LABELS } from '../../types'

interface Row {
  id: string
  fecha: string
  hora: string
  estado: string
  modalidad: string
  prospectos: { nombre_contacto: string; empresa: string | null } | null
  profiles: { full_name: string } | null
}

export default function CitasList({ onlyUpcoming = false }: { onlyUpcoming?: boolean }) {
  const [rows, setRows] = useState<Row[]>([])
  const [estado, setEstado] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    let query = supabase
      .from('citas')
      .select('id, fecha, hora, estado, modalidad, prospectos(nombre_contacto, empresa), profiles(full_name)')
      .eq('eliminado', false)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
    if (onlyUpcoming) query = query.gte('fecha', new Date().toISOString().slice(0, 10))
    const { data } = await query
    setRows((data as unknown as Row[]) ?? [])
    setLoading(false)
  }

  const filtered = rows.filter((r) => !estado || r.estado === estado)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{onlyUpcoming ? 'Agenda' : 'Citas'}</h1>
          <p>{onlyUpcoming ? 'Próximas citas programadas' : 'Historial completo de citas'}</p>
        </div>
        <Link to="/citas/nueva" className="btn">+ Agendar cita</Link>
      </div>

      <div className="toolbar">
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CITA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p className="muted" style={{ padding: 20 }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No hay citas para mostrar.</div>
        ) : (
          <table>
            <thead><tr><th>Fecha</th><th>Hora</th><th>Prospecto</th><th>Vendedor</th><th>Modalidad</th><th>Estado</th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.fecha}</td>
                  <td>{c.hora}</td>
                  <td><Link className="table-link" to={`/citas/${c.id}`}>{c.prospectos?.empresa || c.prospectos?.nombre_contacto}</Link></td>
                  <td>{c.profiles?.full_name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{c.modalidad}</td>
                  <td><Badge value={c.estado} label={ESTADO_CITA_LABELS[c.estado as keyof typeof ESTADO_CITA_LABELS]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
