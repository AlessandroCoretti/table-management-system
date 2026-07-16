import { Navigate } from 'react-router-dom'
import { useAuthStore } from './authStore'

function RequireAuth({ children }) {
  const session = useAuthStore((s) => s.session)

  if (session === undefined) {
    return <div className="p-6 text-sm text-gray-500">Verifica sessione…</div>
  }
  if (session === null) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

export default RequireAuth
