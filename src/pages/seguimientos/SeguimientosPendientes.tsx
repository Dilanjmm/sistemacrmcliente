import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { supabase } from '../../lib/supabase'

interface Row {
  id: string
  proximo_seguimiento: string | null
  observaciones: string
  citas: {
    id: string
    prospecto_id: string
    prospectos: { nombre_contacto: string; empresa: string | null } | null
    profiles: { full_name: string } | null
  } | null
}

export default function SeguimientosPendientes() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('resultados_cita')
      .select('id, proximo_seguimiento, observaciones, citas(id, prospecto_id, prospectos(nombre_contacto, empresa), profiles(full_name))')
      .not('proximo_seguimiento', 'is', null)
      .lte('proximo_seguimiento', today)
      .order('proximo_seguimiento', { ascending: true })
    setRows((data as unknown as Row[]) ?? [])
    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Seguimientos pendientes</h1>
          <p>Prospectos que requieren atención hoy o están atrasados</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p className="muted" style={{ padding: 20 }}>Cargando...</p>
        ) : rows.length === 0 ? (
          <div className="empty-state">No hay seguimientos pendientes. Buen trabajo.</div>
        ) : (
          <table>
            <thead><tr><th>Prospecto</th><th>Vendedor</th><th>Próximo seguimiento</th><th>Nota</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.citas?.prospectos?.empresa || r.citas?.prospectos?.nombre_contacto}</td>
                  <td>{r.citas?.profiles?.full_name}</td>
                  <td>{r.proximo_seguimiento}</td>
                  <td className="muted">{r.observaciones}</td>
                  <td>
                    {r.citas?.prospecto_id && (
                      <Link className="table-link" to={`/prospectos/${r.citas.prospecto_id}`}>Ver prospecto</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
