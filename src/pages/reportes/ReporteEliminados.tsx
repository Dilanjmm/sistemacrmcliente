import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Prospecto } from '../../types'

export default function ReporteEliminados() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])

  useEffect(() => {
    supabase.from('prospectos').select('*').eq('eliminado', true).order('eliminado_at', { ascending: false })
      .then(({ data }) => setProspectos((data as Prospecto[]) ?? []))
  }, [])

  return (
    <div>
      <div className="page-header"><div><h1>Registros eliminados</h1><p>Solo visible para administradores. Estos registros no aparecen en los listados operativos.</p></div></div>
      <div className="section-title">Prospectos eliminados</div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Código</th><th>Nombre / Empresa</th><th>Fecha eliminación</th></tr></thead>
          <tbody>
            {prospectos.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.empresa || p.nombre_contacto}</td>
                <td>{p.eliminado_at ? new Date(p.eliminado_at).toLocaleString('es-BO') : '—'}</td>
              </tr>
            ))}
            {prospectos.length === 0 && <tr><td colSpan={3} className="muted">Sin registros eliminados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
