import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { HistorialPrecio, ProspectoServicio, Servicio } from '../../types'

export default function ReportePrecios() {
  const [historial, setHistorial] = useState<HistorialPrecio[]>([])
  const [servicios, setServicios] = useState<ProspectoServicio[]>([])
  const [catalogo, setCatalogo] = useState<Servicio[]>([])

  useEffect(() => {
    supabase.from('historial_precios').select('*').order('fecha_cambio', { ascending: false })
      .then(({ data }) => setHistorial((data as HistorialPrecio[]) ?? []))
    supabase.from('prospecto_servicios').select('*').then(({ data }) => setServicios((data as ProspectoServicio[]) ?? []))
    supabase.from('servicios').select('*').then(({ data }) => setCatalogo((data as Servicio[]) ?? []))
  }, [])

  return (
    <div>
      <div className="page-header"><div><h1>Reporte de precios</h1><p>Historial completo de modificaciones</p></div></div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Fecha</th><th>Servicio</th><th>Precio anterior</th><th>Precio nuevo</th><th>Motivo</th></tr></thead>
          <tbody>
            {historial.map((h) => {
              const ps = servicios.find((s) => s.id === h.prospecto_servicio_id)
              const servicio = ps ? catalogo.find((c) => c.id === ps.servicio_id) : null
              return (
                <tr key={h.id}>
                  <td>{new Date(h.fecha_cambio).toLocaleDateString('es-BO')}</td>
                  <td>{servicio?.nombre || '—'}</td>
                  <td>Bs. {Number(h.precio_anterior).toLocaleString('es-BO')}</td>
                  <td>Bs. {Number(h.precio_nuevo).toLocaleString('es-BO')}</td>
                  <td>{h.motivo}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
