import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Badge from '../../components/Badge'
import DocumentosPanel from '../../components/DocumentosPanel'
import ServicioNegociado from './ServicioNegociado'
import NuevoServicioProspecto from './NuevoServicioProspecto'
import ClienteConversionForm from './ClienteConversionForm'
import { Cita, Cliente, ESTADO_CITA_LABELS, Prospecto, ProspectoServicio, Servicio } from '../../types'

type Tab = 'info' | 'servicios' | 'citas' | 'documentos'

export default function ProspectoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [prospecto, setProspecto] = useState<Prospecto | null>(null)
  const [servicios, setServicios] = useState<ProspectoServicio[]>([])
  const [catalogo, setCatalogo] = useState<Servicio[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [tab, setTab] = useState<Tab>('info')
  const [showNuevoServicio, setShowNuevoServicio] = useState(false)
  const [pendingConversion, setPendingConversion] = useState(false)

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function load() {
    if (!id) return
    const [{ data: pData }, { data: sData }, { data: catData }, { data: cData }, { data: clienteData }] = await Promise.all([
      supabase.from('prospectos').select('*').eq('id', id).single(),
      supabase.from('prospecto_servicios').select('*').eq('prospecto_id', id).eq('eliminado', false).order('created_at', { ascending: false }),
      supabase.from('servicios').select('*'),
      supabase.from('citas').select('*').eq('prospecto_id', id).eq('eliminado', false).order('fecha', { ascending: false }),
      supabase.from('clientes').select('*').eq('prospecto_id', id).maybeSingle(),
    ])
    setProspecto(pData as Prospecto)
    setServicios((sData as ProspectoServicio[]) ?? [])
    setCatalogo((catData as Servicio[]) ?? [])
    setCitas((cData as Cita[]) ?? [])
    setCliente(clienteData as Cliente | null)
  }

  const canEdit = profile?.role === 'admin' || profile?.id === prospecto?.vendedor_id

  if (!prospecto) return <p className="muted">Cargando...</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{prospecto.empresa || prospecto.nombre_contacto}</h1>
          <p>{prospecto.codigo} · {prospecto.tipo === 'empresa' ? 'Empresa' : 'Persona'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {cliente && <Badge value="aceptado" label="Cliente final" />}
          {canEdit && (
            <button className="btn secondary" onClick={() => navigate(`/prospectos/${prospecto.id}/editar`)}>
              Editar datos
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>Información</button>
        <button className={tab === 'servicios' ? 'active' : ''} onClick={() => setTab('servicios')}>
          Servicios ({servicios.length})
        </button>
        <button className={tab === 'citas' ? 'active' : ''} onClick={() => setTab('citas')}>
          Citas ({citas.length})
        </button>
        <button className={tab === 'documentos' ? 'active' : ''} onClick={() => setTab('documentos')}>Documentos</button>
      </div>

      {tab === 'info' && (
        <div className="grid cols-2">
          <div className="card">
            <div className="section-title" style={{ marginTop: 0 }}>Datos de contacto</div>
            <p><strong>Teléfono:</strong> {prospecto.telefono || '—'}</p>
            <p><strong>WhatsApp:</strong> {prospecto.whatsapp || '—'}</p>
            <p><strong>Correo:</strong> {prospecto.email || '—'}</p>
            <p><strong>Dirección:</strong> {prospecto.direccion || '—'}</p>
            <p><strong>Persona de contacto:</strong> {prospecto.persona_contacto || '—'} {prospecto.cargo_contacto && `(${prospecto.cargo_contacto})`}</p>
          </div>
          <div className="card">
            <div className="section-title" style={{ marginTop: 0 }}>Comercial</div>
            <p><strong>Estado comercial:</strong> {prospecto.estado_comercial}</p>
            <p><strong>Registrado:</strong> {new Date(prospecto.created_at).toLocaleDateString('es-BO')}</p>
            <p><strong>Observaciones:</strong> {prospecto.observaciones || '—'}</p>
            {cliente && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-line)', margin: '12px 0' }} />
                <p><strong>Razón social:</strong> {cliente.razon_social}</p>
                <p><strong>NIT:</strong> {cliente.nit}</p>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'servicios' && (
        <div>
          {pendingConversion && (
            <ClienteConversionForm
              prospecto={prospecto}
              onDone={() => { setPendingConversion(false); load() }}
              onCancel={() => setPendingConversion(false)}
            />
          )}
          {canEdit && !showNuevoServicio && (
            <button className="btn" style={{ marginBottom: 16 }} onClick={() => setShowNuevoServicio(true)}>
              + Ofrecer servicio
            </button>
          )}
          {showNuevoServicio && (
            <div style={{ marginBottom: 16 }}>
              <NuevoServicioProspecto
                prospectoId={prospecto.id}
                onCreated={() => { setShowNuevoServicio(false); load() }}
                onCancel={() => setShowNuevoServicio(false)}
              />
            </div>
          )}
          {servicios.length === 0 ? (
            <p className="muted">Aún no hay servicios ofrecidos a este prospecto.</p>
          ) : (
            servicios.map((ps) => (
              <ServicioNegociado
                key={ps.id}
                ps={ps}
                servicio={catalogo.find((s) => s.id === ps.servicio_id)}
                onChange={load}
                onNeedsClientConversion={() => { if (!cliente) setPendingConversion(true) }}
              />
            ))
          )}
        </div>
      )}

      {tab === 'citas' && (
        <div>
          <Link to={`/citas/nueva?prospecto=${prospecto.id}`} className="btn" style={{ marginBottom: 16, display: 'inline-flex' }}>
            + Agendar cita
          </Link>
          {citas.length === 0 ? (
            <p className="muted">No hay citas registradas.</p>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <table>
                <thead><tr><th>Fecha</th><th>Hora</th><th>Modalidad</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {citas.map((c) => (
                    <tr key={c.id}>
                      <td>{c.fecha}</td>
                      <td>{c.hora}</td>
                      <td style={{ textTransform: 'capitalize' }}>{c.modalidad}</td>
                      <td><Badge value={c.estado} label={ESTADO_CITA_LABELS[c.estado]} /></td>
                      <td><Link className="table-link" to={`/citas/${c.id}`}>Ver</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'documentos' && <DocumentosPanel prospectoId={prospecto.id} />}
    </div>
  )
}
