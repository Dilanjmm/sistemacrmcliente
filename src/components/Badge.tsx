const COLOR_MAP: Record<string, string> = {
  nuevo: 'blue',
  en_seguimiento: 'amber',
  en_negociacion: 'amber',
  interesado: 'blue',
  pendiente_decision: 'amber',
  aceptado: 'green',
  rechazado: 'red',
  pendiente: 'gray',
  confirmada: 'blue',
  realizada: 'green',
  cancelada: 'red',
  reprogramada: 'amber',
  no_asistio: 'red',
  activo: 'green',
  inactivo: 'gray',
}

export default function Badge({ value, label }: { value: string; label: string }) {
  const color = COLOR_MAP[value] || 'gray'
  return <span className={`badge ${color}`}>{label}</span>
}
