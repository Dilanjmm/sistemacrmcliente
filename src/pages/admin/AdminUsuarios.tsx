import { useEffect, useState } from 'react'
import { supabase, supabaseAdminCreate } from '../../lib/supabase'
import { Profile, Role, Sucursal } from '../../types'

export default function AdminUsuarios() {
  const [rows, setRows] = useState<Profile[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'vendedor' as Role, sucursal_id: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('sucursales').select('*'),
    ])
    setRows((p as Profile[]) ?? [])
    setSucursales((s as Sucursal[]) ?? [])
  }

  function sucursalNombre(id: string | null) {
    return sucursales.find((s) => s.id === id)?.nombre || '—'
  }

  async function crearUsuario() {
    setError(null)
    if (!form.full_name.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Completa nombre, correo y una contraseña de al menos 6 caracteres.')
      return
    }
    setLoading(true)
    // Se usa un cliente Supabase secundario sin persistencia de sesión,
    // para que el administrador no pierda su propia sesión al crear otro usuario.
    const { data, error: signUpError } = await supabaseAdminCreate.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    })
    if (signUpError || !data.user) {
      setLoading(false)
      setError(signUpError?.message || 'No se pudo crear el usuario.')
      return
    }
    // El trigger de la base de datos ya creó el profile con rol "consulta".
    // Ahora lo actualizamos con el rol y sucursal elegidos.
    await supabase.from('profiles').update({
      full_name: form.full_name,
      role: form.role,
      sucursal_id: form.sucursal_id || null,
    }).eq('id', data.user.id)

    setLoading(false)
    setShowForm(false)
    setForm({ full_name: '', email: '', password: '', role: 'vendedor', sucursal_id: '' })
    load()
  }

  async function actualizarRol(p: Profile, role: Role) {
    await supabase.from('profiles').update({ role }).eq('id', p.id)
    load()
  }

  async function actualizarSucursal(p: Profile, sucursal_id: string) {
    await supabase.from('profiles').update({ sucursal_id: sucursal_id || null }).eq('id', p.id)
    load()
  }

  async function toggleActivo(p: Profile) {
    await supabase.from('profiles').update({ activo: !p.activo }).eq('id', p.id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Usuarios</h1><p>Vendedores, administradores y usuarios de consulta</p></div>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>+ Nuevo usuario</button>
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="form-group">
            <label>Nombre completo *</label>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Correo *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Contraseña *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rol</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
                <option value="consulta">Consulta</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sucursal</label>
              <select value={form.sucursal_id} onChange={(e) => setForm({ ...form, sucursal_id: e.target.value })}>
                <option value="">Selecciona...</option>
                {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn small" onClick={crearUsuario} disabled={loading}>
            {loading ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Nombre</th><th>Rol</th><th>Sucursal</th><th>Estado</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td>
                  <select value={p.role} onChange={(e) => actualizarRol(p, e.target.value as Role)}>
                    <option value="vendedor">Vendedor</option>
                    <option value="admin">Administrador</option>
                    <option value="consulta">Consulta</option>
                  </select>
                </td>
                <td>
                  <select value={p.sucursal_id || ''} onChange={(e) => actualizarSucursal(p, e.target.value)}>
                    <option value="">Sin asignar</option>
                    {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </td>
                <td>
                  <button className={`badge ${p.activo ? 'green' : 'gray'}`} style={{ border: 'none', cursor: 'pointer' }} onClick={() => toggleActivo(p)}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
