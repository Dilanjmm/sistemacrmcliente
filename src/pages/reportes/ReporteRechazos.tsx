import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MotivoRechazo, ProspectoServicio, Rechazo, Servicio, Prospecto } from '../../types'

export default function ReporteRechazos() {
  const [rechazos, setRechazos] = useState<Rechazo[]>([])
  const [motivos, setMotivos] = useState<MotivoRechazo[]>([])
  const [servicios, setServicios] = useState<ProspectoServicio[]>([])
  const [catalogo, setCatalogo] = useState<Servicio[]>([])
  const [prospectos, setProspectos] = useState<Prospecto[]>([])

  useEffect(() => {
    supabase.from('rechazos').select('*').order('fecha_rechazo', { ascending: false }).then(({ data }) => setRechazos((data as Rechazo[]) ?? []))
    supabase.from('motivos_rechazo').select('*').then(({ data }) => setMotivos((data as MotivoRechazo[]) ?? []))
    supabase.from('prospecto_servicios').select('*').then(({ data }) => setServicios((data as ProspectoServicio[]) ?? []))
    supabase.from('servicios').select('*').then(({ data }) => setCatalogo((data as Servicio[]) ?? []))
    supabase.from('prospectos').select('*').then(({ data }) => setProspectos((data as Prospecto[]) ?? []))
  }, [])

  return (
    <div>
      <div className="page-header"><div><h1>Reporte de rechazos</h1><p>Total: {rechazos.length}</p></div></div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Fecha</th><th>Prospecto</th><th>Servicio</th><th>Motivo</th><th>Observaciones</th></tr></thead>
          <tbody>
            {rechazos.map((r) => {
              const ps = servicios.find((s) => s.id === r.prospecto_servicio_id)
              const servicio = ps ? catalogo.find((c) => c.id === ps.servicio_id) : null
              const prospecto = ps ? prospectos.find((p) => p.id === ps.prospecto_id) : null
              const motivo = motivos.find((m) => m.id === r.motivo_rechazo_id)
              return (
                <tr key={r.id}>
                  <td>{r.fecha_rechazo}</td>
                  <td>{prospecto?.empresa || prospecto?.nombre_contacto || '—'}</td>
                  <td>{servicio?.nombre || '—'}</td>
                  <td>{motivo?.nombre || '—'}</td>
                  <td className="muted">{r.observaciones || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
