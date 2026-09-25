import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Role } from '../types'

export default function ProtectedRoute({
  children,
  allow,
}: {
  children: ReactNode
  allow?: Role[]
}) {
  const { session, profile, loading } = useAuth()

  if (loading) return <div style={{ padding: 40 }}>Cargando...</div>
  if (!session) return <Navigate to="/login" replace />
  if (allow && profile && !allow.includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
