import { useState } from 'react'
import { useDashboardStore } from './dashboardStore'

function WalkInForm() {
  const creatingForTableId = useDashboardStore((s) => s.creatingForTableId)
  const objects = useDashboardStore((s) => s.objects)
  const createWalkIn = useDashboardStore((s) => s.createWalkIn)
  const clearSelection = useDashboardStore((s) => s.clearSelection)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('seated')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!creatingForTableId) return null

  const tableLabel = objects.find((o) => o.id === creatingForTableId)?.label ?? 'n/d'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: err } = await createWalkIn({ name, phone, email, partySize, notes, status })
    setSubmitting(false)
    if (err) setError(err)
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Nuova prenotazione: Tavolo {tableLabel}</h3>
        <button type="button" onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600">
          Chiudi
        </button>
      </div>

      <form className="space-y-2" onSubmit={handleSubmit}>
        <label className="block text-sm text-gray-600">
          Nome cliente
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-sm text-gray-600">
          Telefono
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-sm text-gray-600">
          Email (opzionale)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-sm text-gray-600">
          Persone
          <input
            type="number"
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value) || 1)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-sm text-gray-600">
          Stato iniziale
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="seated">Seduti ora (walk-in)</option>
            <option value="confirmed">Confermata (arriverà più tardi)</option>
          </select>
        </label>
        <label className="block text-sm text-gray-600">
          Note
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? 'Salvataggio…' : 'Crea prenotazione'}
        </button>
      </form>
    </div>
  )
}

export default WalkInForm
