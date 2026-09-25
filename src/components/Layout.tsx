import { NavLink } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

function Item({ to, label }: { to: string; label: string }) {
  return (
    <NavLink to={to} end className={({ isActive }) => (isActive ? 'active' : '')}>
      {label}
    </NavLink>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">CRM Comercial</div>
        <nav>
          <Item to="/" label="Dashboard" />

          <div className="sidebar-section">Comercial</div>
          <Item to="/prospectos" label="Prospectos" />
          <Item to="/agenda" label="Agenda" />
          <Item to="/citas" label="Citas" />
          <Item to="/seguimientos" label="Seguimientos" />
          <Item to="/clientes" label="Clientes" />
          <Item to="/servicios" label="Catálogo de servicios" />

          <div className="sidebar-section">Reportes</div>
          <Item to="/reportes/prospectos" label="Prospectos" />
          <Item to="/reportes/citas" label="Citas" />
          <Item to="/reportes/servicios" label="Servicios" />
          <Item to="/reportes/precios" label="Precios" />
          <Item to="/reportes/rechazos" label="Rechazos" />

          {isAdmin && (
            <>
              <div className="sidebar-section">Administración</div>
              <Item to="/admin/usuarios" label="Usuarios" />
              <Item to="/admin/sucursales" label="Sucursales" />
              <Item to="/admin/servicios" label="Servicios" />
              <Item to="/admin/tipos-cita" label="Tipos de cita" />
              <Item to="/admin/motivos-rechazo" label="Motivos de rechazo" />
              <Item to="/reportes/eliminados" label="Registros eliminados" />
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div style={{ marginBottom: 8 }}>
            {profile?.full_name} <br />
            <span style={{ opacity: 0.6, textTransform: 'capitalize' }}>{profile?.role}</span>
          </div>
          <button className="sidebar-link" onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
