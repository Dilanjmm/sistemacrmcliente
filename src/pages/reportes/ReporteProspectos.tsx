import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Prospecto } from '../../types'

export default function ReporteProspectos() {
  const [rows, setRows] = useState<Prospecto[]>([])
  const [estado, setEstado] = useState('')

  useEffect(() => {
    supabase.from('prospectos').select('*').eq('eliminado', false).order('created_at', { ascending: false })
      .then(({ data }) => setRows((data as Prospecto[]) ?? []))
  }, [])

  const filtered = rows.filter((r) => !estado || r.estado_comercial === estado)

  return (
    <div>
      <div className="page-header"><div><h1>Reporte de prospectos</h1><p>Total: {filtered.length}</p></div></div>
      <div className="toolbar">
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="en_negociacion">En negociación</option>
          <option value="cliente">Cliente</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Código</th><th>Nombre / Empresa</th><th>Tipo</th><th>Estado</th><th>Fecha registro</th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.empresa || p.nombre_contacto}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.tipo}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.estado_comercial}</td>
                <td>{new Date(p.created_at).toLocaleDateString('es-BO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
