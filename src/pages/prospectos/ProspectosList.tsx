import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Prospecto } from '../../types'

export default function ProspectosList() {
  const [rows, setRows] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('prospectos')
      .select('*')
      .eq('eliminado', false)
      .order('created_at', { ascending: false })
    setRows((data as Prospecto[]) ?? [])
    setLoading(false)
  }

  const filtered = rows.filter((p) => {
    const matchesSearch =
      !search ||
      p.nombre_contacto.toLowerCase().includes(search.toLowerCase()) ||
      (p.empresa || '').toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase())
    const matchesEstado = !estado || p.estado_comercial === estado
    return matchesSearch && matchesEstado
  })

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este prospecto? Se ocultará de los listados pero permanecerá en reportes.')) return
    await supabase.from('prospectos').update({ eliminado: true, eliminado_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Prospectos</h1>
          <p>Gestión de posibles clientes</p>
        </div>
        <Link to="/prospectos/nuevo" className="btn">+ Nuevo prospecto</Link>
      </div>

      <div className="toolbar">
        <input placeholder="Buscar por nombre, empresa o código..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 260 }} />
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="en_negociacion">En negociación</option>
          <option value="cliente">Cliente</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p className="muted" style={{ padding: 20 }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No se encontraron prospectos.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Contacto / Empresa</th>
                <th>Tipo</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo}</td>
                  <td>
                    <Link to={`/prospectos/${p.id}`} className="table-link">
                      {p.empresa || p.nombre_contacto}
                    </Link>
                    {p.empresa && <div className="muted" style={{ fontSize: 13 }}>{p.nombre_contacto}</div>}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{p.tipo}</td>
                  <td>{p.telefono || p.whatsapp || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.estado_comercial}</td>
                  <td>
                    <button className="btn secondary small" onClick={() => eliminar(p.id)}>Eliminar</button>
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
