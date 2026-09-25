import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Cliente } from '../../types'

export default function ClientesList() {
  const [rows, setRows] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('fecha_conversion', { ascending: false })
    setRows((data as Cliente[]) ?? [])
    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Clientes</h1><p>Prospectos que aceptaron al menos un servicio</p></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p className="muted" style={{ padding: 20 }}>Cargando...</p>
        ) : rows.length === 0 ? (
          <div className="empty-state">Aún no hay clientes convertidos.</div>
        ) : (
          <table>
            <thead><tr><th>Razón social</th><th>NIT</th><th>Contacto</th><th>Fecha conversión</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><Link className="table-link" to={`/clientes/${c.id}`}>{c.razon_social}</Link></td>
                  <td>{c.nit}</td>
                  <td>{c.contacto_nombre}</td>
                  <td>{new Date(c.fecha_conversion).toLocaleDateString('es-BO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
