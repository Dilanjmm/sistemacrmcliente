import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/Badge'
import DocumentosPanel from '../../components/DocumentosPanel'
import { Cliente, ESTADO_SERVICIO_LABELS, ProspectoServicio, Servicio } from '../../types'

export default function ClienteDetail() {
  const { id } = useParams()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [servicios, setServicios] = useState<ProspectoServicio[]>([])
  const [catalogo, setCatalogo] = useState<Servicio[]>([])

  useEffect(() => { if (id) load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const { data: c } = await supabase.from('clientes').select('*').eq('id', id).single()
    setCliente(c as Cliente)
    if (c) {
      const { data: s } = await supabase.from('prospecto_servicios').select('*').eq('prospecto_id', c.prospecto_id)
      setServicios((s as ProspectoServicio[]) ?? [])
    }
    const { data: cat } = await supabase.from('servicios').select('*')
    setCatalogo((cat as Servicio[]) ?? [])
  }

  if (!cliente) return <p className="muted">Cargando...</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{cliente.razon_social}</h1>
          <p>NIT {cliente.nit} · Cliente desde {new Date(cliente.fecha_conversion).toLocaleDateString('es-BO')}</p>
        </div>
        <Link to={`/prospectos/${cliente.prospecto_id}`} className="btn secondary">Ver historial comercial completo</Link>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Datos de la empresa</div>
          <p><strong>Teléfono:</strong> {cliente.telefono_empresa || '—'}</p>
          <p><strong>Correo:</strong> {cliente.email_empresa || '—'}</p>
          <p><strong>Dirección:</strong> {cliente.direccion_empresa || '—'}</p>
        </div>
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Contacto</div>
          <p><strong>Nombre:</strong> {cliente.contacto_nombre}</p>
          <p><strong>Cargo:</strong> {cliente.contacto_cargo || '—'}</p>
          <p><strong>Teléfono:</strong> {cliente.contacto_telefono || '—'}</p>
          <p><strong>WhatsApp:</strong> {cliente.contacto_whatsapp || '—'}</p>
          <p><strong>Correo:</strong> {cliente.contacto_email || '—'}</p>
        </div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>Servicios contratados / negociados</div>
        <table>
          <thead><tr><th>Servicio</th><th>Precio actual</th><th>Estado</th></tr></thead>
          <tbody>
            {servicios.map((s) => (
              <tr key={s.id}>
                <td>{catalogo.find((c) => c.id === s.servicio_id)?.nombre}</td>
                <td>Bs. {Number(s.precio_actual).toLocaleString('es-BO')}</td>
                <td><Badge value={s.estado} label={ESTADO_SERVICIO_LABELS[s.estado]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>Documentos del cliente</div>
        <DocumentosPanel clienteId={cliente.id} />
      </div>
    </div>
  )
}
