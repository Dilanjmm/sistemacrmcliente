import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/Badge'
import { ESTADO_CITA_LABELS } from '../../types'

interface Row {
  id: string; fecha: string; hora: string; estado: string; modalidad: string
  prospectos: { nombre_contacto: string; empresa: string | null } | null
  profiles: { full_name: string } | null
}

export default function ReporteCitas() {
  const [rows, setRows] = useState<Row[]>([])
  const [estado, setEstado] = useState('')

  useEffect(() => {
    supabase
      .from('citas')
      .select('id, fecha, hora, estado, modalidad, prospectos(nombre_contacto, empresa), profiles(full_name)')
      .eq('eliminado', false)
      .order('fecha', { ascending: false })
      .then(({ data }) => setRows((data as unknown as Row[]) ?? []))
  }, [])

  const filtered = rows.filter((r) => !estado || r.estado === estado)

  return (
    <div>
      <div className="page-header"><div><h1>Reporte de citas</h1><p>Total: {filtered.length}</p></div></div>
      <div className="toolbar">
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todas</option>
          {Object.entries(ESTADO_CITA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Fecha</th><th>Hora</th><th>Prospecto</th><th>Vendedor</th><th>Modalidad</th><th>Estado</th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>{c.fecha}</td><td>{c.hora}</td>
                <td>{c.prospectos?.empresa || c.prospectos?.nombre_contacto}</td>
                <td>{c.profiles?.full_name}</td>
                <td style={{ textTransform: 'capitalize' }}>{c.modalidad}</td>
                <td><Badge value={c.estado} label={ESTADO_CITA_LABELS[c.estado as keyof typeof ESTADO_CITA_LABELS]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
