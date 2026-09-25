import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Row { id: string; nombre: string; activo: boolean }

export default function SimpleCatalogAdmin({
  table, title, description,
}: { table: string; title: string; description: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [table]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const { data } = await supabase.from(table).select('*').order('nombre')
    setRows((data as Row[]) ?? [])
  }

  async function crear() {
    setError(null)
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
    const { error } = await supabase.from(table).insert({ nombre })
    if (error) { setError(error.message); return }
    setNombre('')
    load()
  }

  async function toggleActivo(r: Row) {
    await supabase.from(table).update({ activo: !r.activo }).eq('id', r.id)
    load()
  }

  return (
    <div>
      <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div></div>

      <div className="card" style={{ maxWidth: 440 }}>
        <div className="form-group">
          <label>Nombre *</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn small" onClick={crear}>Agregar</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Nombre</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.nombre}</td>
                <td><span className={`badge ${r.activo ? 'green' : 'gray'}`}>{r.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td><button className="btn secondary small" onClick={() => toggleActivo(r)}>{r.activo ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
