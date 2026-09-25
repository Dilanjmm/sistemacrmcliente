import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Sucursal } from '../../types'

export default function AdminSucursales() {
  const [rows, setRows] = useState<Sucursal[]>([])
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('sucursales').select('*').order('nombre')
    setRows((data as Sucursal[]) ?? [])
  }

  async function crear() {
    setError(null)
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
    const { error } = await supabase.from('sucursales').insert({ nombre, direccion: direccion || null })
    if (error) { setError(error.message); return }
    setNombre(''); setDireccion('')
    load()
  }

  async function toggleActivo(s: Sucursal) {
    await supabase.from('sucursales').update({ activo: !s.activo }).eq('id', s.id)
    load()
  }

  return (
    <div>
      <div className="page-header"><div><h1>Sucursales</h1><p>Unidades de negocio por las que se separan los datos</p></div></div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label>Nombre *</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn small" onClick={crear}>Agregar sucursal</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Nombre</th><th>Dirección</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.nombre}</td>
                <td className="muted">{s.direccion || '—'}</td>
                <td><span className={`badge ${s.activo ? 'green' : 'gray'}`}>{s.activo ? 'Activa' : 'Inactiva'}</span></td>
                <td><button className="btn secondary small" onClick={() => toggleActivo(s)}>{s.activo ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
