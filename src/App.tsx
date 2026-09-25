import { ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

import ProspectosList from './pages/prospectos/ProspectosList'
import ProspectoForm from './pages/prospectos/ProspectoForm'
import ProspectoDetail from './pages/prospectos/ProspectoDetail'

import ServiciosList from './pages/servicios/ServiciosList'

import CitasList from './pages/citas/CitasList'
import NuevaCita from './pages/citas/NuevaCita'
import CitaDetail from './pages/citas/CitaDetail'

import SeguimientosPendientes from './pages/seguimientos/SeguimientosPendientes'

import ClientesList from './pages/clientes/ClientesList'
import ClienteDetail from './pages/clientes/ClienteDetail'

import ReporteProspectos from './pages/reportes/ReporteProspectos'
import ReporteCitas from './pages/reportes/ReporteCitas'
import ReporteServicios from './pages/reportes/ReporteServicios'
import ReportePrecios from './pages/reportes/ReportePrecios'
import ReporteRechazos from './pages/reportes/ReporteRechazos'
import ReporteEliminados from './pages/reportes/ReporteEliminados'

import AdminUsuarios from './pages/admin/AdminUsuarios'
import AdminSucursales from './pages/admin/AdminSucursales'
import SimpleCatalogAdmin from './pages/admin/SimpleCatalogAdmin'

function Shell({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Shell><Dashboard /></Shell>} />

          <Route path="/prospectos" element={<Shell><ProspectosList /></Shell>} />
          <Route path="/prospectos/nuevo" element={<Shell><ProspectoForm /></Shell>} />
          <Route path="/prospectos/:id" element={<Shell><ProspectoDetail /></Shell>} />
          <Route path="/prospectos/:id/editar" element={<Shell><ProspectoForm /></Shell>} />

          <Route path="/servicios" element={<Shell><ServiciosList /></Shell>} />

          <Route path="/agenda" element={<Shell><CitasList onlyUpcoming /></Shell>} />
          <Route path="/citas" element={<Shell><CitasList /></Shell>} />
          <Route path="/citas/nueva" element={<Shell><NuevaCita /></Shell>} />
          <Route path="/citas/:id" element={<Shell><CitaDetail /></Shell>} />

          <Route path="/seguimientos" element={<Shell><SeguimientosPendientes /></Shell>} />
          <Route path="/seguimientos/pendientes" element={<Shell><SeguimientosPendientes /></Shell>} />

          <Route path="/clientes" element={<Shell><ClientesList /></Shell>} />
          <Route path="/clientes/:id" element={<Shell><ClienteDetail /></Shell>} />

          <Route path="/reportes/prospectos" element={<Shell><ReporteProspectos /></Shell>} />
          <Route path="/reportes/citas" element={<Shell><ReporteCitas /></Shell>} />
          <Route path="/reportes/servicios" element={<Shell><ReporteServicios /></Shell>} />
          <Route path="/reportes/precios" element={<Shell><ReportePrecios /></Shell>} />
          <Route path="/reportes/rechazos" element={<Shell><ReporteRechazos /></Shell>} />
          <Route
            path="/reportes/eliminados"
            element={<ProtectedRoute allow={['admin']}><Layout><ReporteEliminados /></Layout></ProtectedRoute>}
          />

          <Route path="/admin/usuarios" element={<ProtectedRoute allow={['admin']}><Layout><AdminUsuarios /></Layout></ProtectedRoute>} />
          <Route path="/admin/sucursales" element={<ProtectedRoute allow={['admin']}><Layout><AdminSucursales /></Layout></ProtectedRoute>} />
          <Route path="/admin/servicios" element={<ProtectedRoute allow={['admin']}><Layout><ServiciosList /></Layout></ProtectedRoute>} />
          <Route
            path="/admin/tipos-cita"
            element={
              <ProtectedRoute allow={['admin']}>
                <Layout><SimpleCatalogAdmin table="tipos_cita" title="Tipos de cita" description="Opciones disponibles al agendar una cita" /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/motivos-rechazo"
            element={
              <ProtectedRoute allow={['admin']}>
                <Layout><SimpleCatalogAdmin table="motivos_rechazo" title="Motivos de rechazo" description="Opciones disponibles al registrar un rechazo" /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
