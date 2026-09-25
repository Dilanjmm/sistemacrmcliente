import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { session, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError('Correo o contraseña incorrectos.')
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>CRM Comercial</h1>
        <p>Ingresa con tu correo y contraseña</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
