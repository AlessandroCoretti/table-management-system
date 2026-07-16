import { RESERVATION_STATUS_LABELS, useDashboardStore } from './dashboardStore'

const STATUS_BADGE = {
  confirmed: 'bg-blue-100 text-blue-700',
  seated: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700 line-through',
  no_show: 'bg-red-100 text-red-700',
}

function ReservationList() {
  const reservationsForDay = useDashboardStore((s) => s.reservationsForDay)
  const objects = useDashboardStore((s) => s.objects)
  const selectedReservationId = useDashboardStore((s) => s.selectedReservationId)
  const selectReservation = useDashboardStore((s) => s.selectReservation)

  const tableLabelById = (id) => objects.find((o) => o.id === id)?.label ?? '—'

  if (!reservationsForDay.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Nessuna prenotazione per questo giorno.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {reservationsForDay.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => selectReservation(r.id)}
          className={`flex w-full items-center justify-between gap-2 p-3 text-left text-sm hover:bg-gray-50 ${
            r.id === selectedReservationId ? 'bg-brand/5' : ''
          }`}
        >
          <div>
            <p className="font-medium text-gray-900">
              {new Date(r.arrival_time).toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              — {r.customer_name} ({r.party_size}p) · Tavolo {tableLabelById(r.table_id)}
            </p>
            <p className="text-xs text-gray-500">{r.customer_phone}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[r.status]}`}>
            {RESERVATION_STATUS_LABELS[r.status]}
          </span>
        </button>
      ))}
    </div>
  )
}

export default ReservationList
