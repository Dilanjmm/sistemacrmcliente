import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Kpis {
  totalProspectos: number
  nuevos: number
  enSeguimiento: number
  enNegociacion: number
  citasHoy: number
  proximasCitas: number
  seguimientosPendientes: number
  clientesAceptados: number
  serviciosRechazados: number
}

interface CitaRow {
  id: string
  fecha: string
  hora: string
  prospectos: { nombre_contacto: string; empresa: string | null } | null
  profiles: { full_name: string } | null
}

interface SeguimientoRow {
  id: string
  proximo_seguimiento: string | null
  cita_id: string
  citas: { prospectos: { nombre_contacto: string; empresa: string | null }; vendedor_id: string } | null
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [proximasCitas, setProximasCitas] = useState<CitaRow[]>([])
  const [seguimientos, setSeguimientos] = useState<SeguimientoRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    const [
      { count: totalProspectos },
      { count: nuevos },
      { count: enSeguimiento },
      { count: enNegociacion },
      { count: citasHoy },
      { count: proximasCitasCount },
      { count: clientesAceptados },
      { count: serviciosRechazados },
      { data: citasData },
      { data: segData },
    ] = await Promise.all([
      supabase.from('prospectos').select('*', { count: 'exact', head: true }).eq('eliminado', false),
      supabase.from('prospectos').select('*', { count: 'exact', head: true }).eq('eliminado', false).eq('estado_comercial', 'activo'),
      supabase.from('prospecto_servicios').select('*', { count: 'exact', head: true }).eq('estado', 'en_seguimiento'),
      supabase.from('prospecto_servicios').select('*', { count: 'exact', head: true }).eq('estado', 'en_negociacion'),
      supabase.from('citas').select('*', { count: 'exact', head: true }).eq('fecha', today).eq('eliminado', false),
      supabase.from('citas').select('*', { count: 'exact', head: true }).gte('fecha', today).lte('fecha', in7).eq('eliminado', false),
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
      supabase.from('prospecto_servicios').select('*', { count: 'exact', head: true }).eq('estado', 'rechazado'),
      supabase
        .from('citas')
        .select('id, fecha, hora, prospectos(nombre_contacto, empresa), profiles(full_name)')
        .gte('fecha', today)
        .eq('eliminado', false)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })
        .limit(6),
      supabase
        .from('resultados_cita')
        .select('id, proximo_seguimiento, cita_id, citas(prospectos(nombre_contacto, empresa), vendedor_id)')
        .not('proximo_seguimiento', 'is', null)
        .gte('proximo_seguimiento', today)
        .order('proximo_seguimiento', { ascending: true })
        .limit(6),
    ])

    setKpis({
      totalProspectos: totalProspectos ?? 0,
      nuevos: nuevos ?? 0,
      enSeguimiento: enSeguimiento ?? 0,
      enNegociacion: enNegociacion ?? 0,
      citasHoy: citasHoy ?? 0,
      proximasCitas: proximasCitasCount ?? 0,
      seguimientosPendientes: (segData ?? []).length,
      clientesAceptados: clientesAceptados ?? 0,
      serviciosRechazados: serviciosRechazados ?? 0,
    })
    setProximasCitas((citasData as unknown as CitaRow[]) ?? [])
    setSeguimientos((segData as unknown as SeguimientoRow[]) ?? [])
    setLoading(false)
  }

  if (loading || !kpis) return <p className="muted">Cargando panel...</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen del proceso comercial</p>
        </div>
      </div>

      <div className="grid cols-4">
        <div className="stat-card"><div className="value">{kpis.totalProspectos}</div><div className="label">Total prospectos</div></div>
        <div className="stat-card"><div className="value">{kpis.nuevos}</div><div className="label">Prospectos activos</div></div>
        <div className="stat-card"><div className="value">{kpis.enSeguimiento}</div><div className="label">Servicios en seguimiento</div></div>
        <div className="stat-card"><div className="value">{kpis.enNegociacion}</div><div className="label">Servicios en negociación</div></div>
        <div className="stat-card"><div className="value">{kpis.citasHoy}</div><div className="label">Citas de hoy</div></div>
        <div className="stat-card"><div className="value">{kpis.proximasCitas}</div><div className="label">Próximas citas (7 días)</div></div>
        <div className="stat-card"><div className="value">{kpis.clientesAceptados}</div><div className="label">Clientes aceptados</div></div>
        <div className="stat-card"><div className="value">{kpis.serviciosRechazados}</div><div className="label">Servicios rechazados</div></div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 22 }}>
        <div className="card">
          <div className="page-header" style={{ marginBottom: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 15 }}>Próximas citas</h3>
            <Link to="/agenda" className="muted" style={{ fontSize: 13 }}>Ver agenda →</Link>
          </div>
          {proximasCitas.length === 0 && <p className="muted">No hay citas próximas.</p>}
          {proximasCitas.map((c) => (
            <div key={c.id} className="list-item">
              <strong>{c.prospectos?.empresa || c.prospectos?.nombre_contacto}</strong>
              <div className="muted" style={{ fontSize: 13 }}>
                {c.fecha} · {c.hora} · {c.profiles?.full_name}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="page-header" style={{ marginBottom: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 15 }}>Seguimientos pendientes</h3>
            <Link to="/seguimientos" className="muted" style={{ fontSize: 13 }}>Ver todos →</Link>
          </div>
          {seguimientos.length === 0 && <p className="muted">No hay seguimientos pendientes.</p>}
          {seguimientos.map((s) => (
            <div key={s.id} className="list-item">
              <strong>{s.citas?.prospectos?.empresa || s.citas?.prospectos?.nombre_contacto}</strong>
              <div className="muted" style={{ fontSize: 13 }}>Próximo contacto: {s.proximo_seguimiento}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
