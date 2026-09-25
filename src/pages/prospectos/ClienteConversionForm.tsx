import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Prospecto } from '../../types'

export default function ClienteConversionForm({
  prospecto, onDone, onCancel,
}: { prospecto: Prospecto; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    razon_social: prospecto.empresa || '',
    nit: '',
    telefono_empresa: prospecto.telefono || '',
    email_empresa: prospecto.email || '',
    direccion_empresa: prospecto.direccion || '',
    contacto_nombre: prospecto.persona_contacto || prospecto.nombre_contacto,
    contacto_cargo: prospecto.cargo_contacto || '',
    contacto_telefono: prospecto.telefono || '',
    contacto_whatsapp: prospecto.whatsapp || '',
    contacto_email: prospecto.email || '',
  })
  const [error, setError] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit() {
    setError(null)
    if (!form.razon_social.trim() || !form.nit.trim() || !form.contacto_nombre.trim()) {
      setError('Razón social, NIT y nombre de contacto son obligatorios.')
      return
    }
    const { error } = await supabase.from('clientes').insert({
      prospecto_id: prospecto.id,
      sucursal_id: prospecto.sucursal_id,
      ...form,
    })
    if (error) { setError(error.message); return }
    await supabase.from('prospectos').update({ estado_comercial: 'cliente' }).eq('id', prospecto.id)
    onDone()
  }

  return (
    <div className="card" style={{ background: '#EFF5F1' }}>
      <div className="section-title" style={{ marginTop: 0 }}>Completar datos para convertir en cliente final</div>
      <p className="muted" style={{ marginBottom: 14 }}>
        Este servicio fue aceptado. Completa los datos del cliente para finalizar la conversión.
      </p>
      <div className="form-row">
        <div className="form-group">
          <label>Razón social *</label>
          <input value={form.razon_social} onChange={(e) => update('razon_social', e.target.value)} />
        </div>
        <div className="form-group">
          <label>NIT *</label>
          <input value={form.nit} onChange={(e) => update('nit', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Teléfono empresa</label>
          <input value={form.telefono_empresa} onChange={(e) => update('telefono_empresa', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Correo empresa</label>
          <input value={form.email_empresa} onChange={(e) => update('email_empresa', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Dirección empresa</label>
        <input value={form.direccion_empresa} onChange={(e) => update('direccion_empresa', e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Nombre de contacto *</label>
          <input value={form.contacto_nombre} onChange={(e) => update('contacto_nombre', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Cargo</label>
          <input value={form.contacto_cargo} onChange={(e) => update('contacto_cargo', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Teléfono contacto</label>
          <input value={form.contacto_telefono} onChange={(e) => update('contacto_telefono', e.target.value)} />
        </div>
        <div className="form-group">
          <label>WhatsApp contacto</label>
          <input value={form.contacto_whatsapp} onChange={(e) => update('contacto_whatsapp', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Correo contacto</label>
        <input value={form.contacto_email} onChange={(e) => update('contacto_email', e.target.value)} />
      </div>
      {error && <p className="error-text">{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn small" onClick={submit}>Confirmar conversión</button>
        <button className="btn secondary small" onClick={onCancel}>Más tarde</button>
      </div>
    </div>
  )
}
