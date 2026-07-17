import { useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import BookingPage from './features/booking/BookingPage'
import AdminLoginPage from './features/admin/AdminLoginPage'
import AdminDashboardPage from './features/admin/AdminDashboardPage'
import RequireAuth from './features/admin/RequireAuth'
import { useAuthStore } from './features/admin/authStore'
import FloorPlanEditorPage from './features/floor-plan-editor/FloorPlanEditorPage'
import LayoutsPage from './features/layouts/LayoutsPage'

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-brand' : 'text-gray-600 hover:text-gray-900'
  }`

function App() {
  const initAuth = useAuthStore((s) => s.init)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <div className="min-h-svh bg-gray-50">
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6">
          <span className="font-semibold text-gray-900">Table Management System</span>
          <NavLink to="/" end className={navLinkClass}>
            Prenota
          </NavLink>
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
          <NavLink to="/admin/editor" className={navLinkClass}>
            Editor piantina
          </NavLink>
          <NavLink to="/admin/layouts" className={navLinkClass}>
            Disposizioni
          </NavLink>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/editor"
          element={
            <RequireAuth>
              <FloorPlanEditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/layouts"
          element={
            <RequireAuth>
              <LayoutsPage />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  )
}

export default App
