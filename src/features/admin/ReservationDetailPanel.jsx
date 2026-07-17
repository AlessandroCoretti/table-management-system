import { RESERVATION_STATUS_LABELS, useDashboardStore } from './dashboardStore'

function ReservationDetailPanel() {
  const reservationsForDay = useDashboardStore((s) => s.reservationsForDay)
  const selectedReservationId = useDashboardStore((s) => s.selectedReservationId)
  const objects = useDashboardStore((s) => s.objects)
  const updateReservationStatus = useDashboardStore((s) => s.updateReservationStatus)
  const deleteReservation = useDashboardStore((s) => s.deleteReservation)
  const clearSelection = useDashboardStore((s) => s.clearSelection)

  const reservation = reservationsForDay.find((r) => r.id === selectedReservationId)
  if (!reservation) return null

  const tableLabel = objects.find((o) => o.id === reservation.table_id)?.label ?? 'n/d'

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Prenotazione: Tavolo {tableLabel}</h3>
        <button type="button" onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600">
          Chiudi
        </button>
      </div>

      <dl className="space-y-1 text-sm text-gray-700">
        <div>
          <dt className="inline text-gray-500">Cliente: </dt>
          <dd className="inline">{reservation.customer_name}</dd>
        </div>
        <div>
          <dt className="inline text-gray-500">Telefono: </dt>
          <dd className="inline">{reservation.customer_phone}</dd>
        </div>
        <div>
          <dt className="inline text-gray-500">Email: </dt>
          <dd className="inline">{reservation.customer_email}</dd>
        </div>
        <div>
          <dt className="inline text-gray-500">Persone: </dt>
          <dd className="inline">{reservation.party_size}</dd>
        </div>
        <div>
          <dt className="inline text-gray-500">Arrivo: </dt>
          <dd className="inline">
            {new Date(reservation.arrival_time).toLocaleString('it-IT', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}{' '}
            ({reservation.duration_minutes} min)
          </dd>
        </div>
        {reservation.notes && (
          <div>
            <dt className="inline text-gray-500">Note: </dt>
            <dd className="inline">{reservation.notes}</dd>
          </div>
        )}
        <div>
          <dt className="inline text-gray-500">Stato: </dt>
          <dd className="inline font-medium">{RESERVATION_STATUS_LABELS[reservation.status]}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 pt-1">
        {reservation.status !== 'seated' && (
          <button
            type="button"
            onClick={() => updateReservationStatus(reservation.id, 'seated')}
            className="rounded-md border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
          >
            Segna arrivati
          </button>
        )}
        {reservation.status !== 'completed' && (
          <button
            type="button"
            onClick={() => updateReservationStatus(reservation.id, 'completed')}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            Segna completata
          </button>
        )}
        {reservation.status !== 'no_show' && (
          <button
            type="button"
            onClick={() => updateReservationStatus(reservation.id, 'no_show')}
            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
          >
            No-show
          </button>
        )}
        {reservation.status !== 'cancelled' && (
          <button
            type="button"
            onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
          >
            Cancella
          </button>
        )}
        <button
          type="button"
          onClick={() => deleteReservation(reservation.id)}
          className="rounded-md border border-red-400 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
        >
          Elimina definitivamente
        </button>
      </div>
    </div>
  )
}

export default ReservationDetailPanel
