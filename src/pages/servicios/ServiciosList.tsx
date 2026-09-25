import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Servicio } from '../../types'

export default function ServiciosList() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<Servicio[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '' })
  const [error, setError] = useState<string | null>(null)
  const isAdmin = profile?.role === 'admin'

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('servicios').select('*').order('nombre')
    setRows((data as Servicio[]) ?? [])
  }

  async function crear() {
    setError(null)
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setError('Código y nombre son obligatorios.')
      return
    }
    const { error } = await supabase.from('servicios').insert(form)
    if (error) { setError(error.message); return }
    setForm({ codigo: '', nombre: '', descripcion: '' })
    setShowForm(false)
    load()
  }

  async function toggleActivo(s: Servicio) {
    await supabase.from('servicios').update({ activo: !s.activo }).eq('id', s.id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Catálogo de servicios</h1>
          <p>Servicios que la empresa ofrece a los prospectos</p>
        </div>
        {isAdmin && <button className="btn" onClick={() => setShowForm((v) => !v)}>+ Nuevo servicio</button>}
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="form-row">
            <div className="form-group">
              <label>Código *</label>
              <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Nombre *</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn small" onClick={crear}>Guardar</button>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Código</th><th>Nombre</th><th>Descripción</th><th>Estado</th>{isAdmin && <th></th>}</tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.codigo}</td>
                <td>{s.nombre}</td>
                <td className="muted">{s.descripcion || '—'}</td>
                <td>
                  <span className={`badge ${s.activo ? 'green' : 'gray'}`}>{s.activo ? 'Activo' : 'Inactivo'}</span>
                </td>
                {isAdmin && (
                  <td>
                    <button className="btn secondary small" onClick={() => toggleActivo(s)}>
                      {s.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
