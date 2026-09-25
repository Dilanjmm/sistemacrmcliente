import { useEffect, useState, ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Documento } from '../types'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

interface Props {
  prospectoId?: string
  prospectoServicioId?: string
  citaId?: string
  clienteId?: string
}

export default function DocumentosPanel(props: Props) {
  const { profile } = useAuth()
  const [docs, setDocs] = useState<Documento[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.prospectoId, props.prospectoServicioId, props.citaId, props.clienteId])

  async function load() {
    let query = supabase.from('documentos').select('*').eq('eliminado', false).order('created_at', { ascending: false })
    if (props.prospectoId) query = query.eq('prospecto_id', props.prospectoId)
    if (props.prospectoServicioId) query = query.eq('prospecto_servicio_id', props.prospectoServicioId)
    if (props.citaId) query = query.eq('cita_id', props.citaId)
    if (props.clienteId) query = query.eq('cliente_id', props.clienteId)
    const { data } = await query
    setDocs((data as Documento[]) ?? [])
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError('El archivo supera el límite de 10 MB.')
      return
    }
    setUploading(true)
    const path = `${props.prospectoId || 'general'}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('documentos-crm').upload(path, file)
    if (upErr) {
      setUploading(false)
      setError('No se pudo subir el archivo: ' + upErr.message)
      return
    }
    await supabase.from('documentos').insert({
      prospecto_id: props.prospectoId || null,
      prospecto_servicio_id: props.prospectoServicioId || null,
      cita_id: props.citaId || null,
      cliente_id: props.clienteId || null,
      storage_path: path,
      nombre_archivo: file.name,
      tamano_bytes: file.size,
      subido_por: profile?.id,
    })
    setUploading(false)
    load()
  }

  async function eliminar(doc: Documento) {
    if (!confirm('¿Eliminar este documento?')) return
    await supabase.from('documentos').update({ eliminado: true }).eq('id', doc.id)
    load()
  }

  async function descargar(doc: Documento) {
    const { data } = await supabase.storage.from('documentos-crm').createSignedUrl(doc.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input type="file" onChange={handleFile} disabled={uploading} />
        <p className="helper-text">Máximo 10 MB por archivo.</p>
        {error && <p className="error-text">{error}</p>}
      </div>
      {docs.length === 0 ? (
        <p className="muted">No hay documentos adjuntos.</p>
      ) : (
        <table>
          <thead><tr><th>Archivo</th><th>Tamaño</th><th>Fecha</th><th></th></tr></thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td>{d.nombre_archivo}</td>
                <td>{d.tamano_bytes ? `${(d.tamano_bytes / 1024 / 1024).toFixed(2)} MB` : '—'}</td>
                <td>{new Date(d.created_at).toLocaleDateString('es-BO')}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn secondary small" onClick={() => descargar(d)}>Ver</button>
                  <button className="btn secondary small" onClick={() => eliminar(d)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
