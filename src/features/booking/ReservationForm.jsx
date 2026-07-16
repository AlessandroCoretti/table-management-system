import { useState } from 'react'
import { useBookingStore } from './bookingStore'

function ReservationForm() {
  const selectedTableId = useBookingStore((s) => s.selectedTableId)
  const submitting = useBookingStore((s) => s.submitting)
  const submitError = useBookingStore((s) => s.submitError)
  const submitReservation = useBookingStore((s) => s.submitReservation)
  const clearSelection = useBookingStore((s) => s.clearSelection)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  if (!selectedTableId) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">Completa la prenotazione</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            submitReservation({ name, phone, email, notes })
          }}
        >
          <label className="block text-sm text-gray-600">
            Nome e cognome
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-gray-600">
            Telefono
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-gray-600">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-gray-600">
            Note (opzionale)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={clearSelection}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {submitting ? 'Invio…' : 'Conferma prenotazione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReservationForm
