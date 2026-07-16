import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from './authStore'

function AdminLoginPage() {
  const session = useAuthStore((s) => s.session)
  const error = useAuthStore((s) => s.error)
  const signIn = useAuthStore((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (session) return <Navigate to="/admin" replace />

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Accesso amministratore</h1>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          signIn(email, password)
        }}
      >
        <label className="block text-sm text-gray-600">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-gray-600">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Accedi
        </button>
      </form>
    </div>
  )
}

export default AdminLoginPage
