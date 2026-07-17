import { useEffect } from 'react'
import { localDateString, localTimeString } from '../../lib/dateHelpers'
import BookingCanvas from './BookingCanvas'
import ReservationForm from './ReservationForm'
import { useBookingStore } from './bookingStore'

function BookingPage() {
  const init = useBookingStore((s) => s.init)
  const loading = useBookingStore((s) => s.loading)
  const error = useBookingStore((s) => s.error)
  const restaurant = useBookingStore((s) => s.restaurant)
  const floorPlans = useBookingStore((s) => s.floorPlans)
  const activeFloorPlanId = useBookingStore((s) => s.activeFloorPlanId)
  const selectFloorPlan = useBookingStore((s) => s.selectFloorPlan)
  const partySize = useBookingStore((s) => s.partySize)
  const setPartySize = useBookingStore((s) => s.setPartySize)
  const arrivalDate = useBookingStore((s) => s.arrivalDate)
  const setArrivalDate = useBookingStore((s) => s.setArrivalDate)
  const arrivalTime = useBookingStore((s) => s.arrivalTime)
  const setArrivalTime = useBookingStore((s) => s.setArrivalTime)
  const confirmedReservation = useBookingStore((s) => s.confirmedReservation)
  const resetConfirmation = useBookingStore((s) => s.resetConfirmation)

  useEffect(() => {
    init()
  }, [init])

  const activeFloorPlan = floorPlans.find((fp) => fp.id === activeFloorPlanId)

  const today = localDateString()
  const isToday = arrivalDate === today
  const minTime = isToday && localTimeString() > '18:00' ? localTimeString() : '18:00'

  if (confirmedReservation) {
    return (
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-green-800">Prenotazione confermata!</h1>
          <p className="mt-2 text-sm text-green-700">
            Ti aspettiamo il{' '}
            {new Date(confirmedReservation.arrival_time).toLocaleString('it-IT', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}{' '}
            per {confirmedReservation.party_size} persone.
          </p>
          <p className="mt-2 text-sm text-green-700">
            Una email di conferma arriverà a breve a {confirmedReservation.customer_email}.
          </p>
          <button
            type="button"
            onClick={resetConfirmation}
            className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Fai un'altra prenotazione
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Prenota un tavolo{restaurant ? ` da ${restaurant.name}` : ''}
      </h1>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Caricamento…</p>}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
            <label className="text-sm text-gray-600">
              Data
              <input
                type="date"
                value={arrivalDate}
                min={today}
                onChange={(e) => setArrivalDate(e.target.value < today ? today : e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-gray-600">
              Orario di arrivo
              <input
                type="time"
                value={arrivalTime}
                min={minTime}
                onChange={(e) => setArrivalTime(e.target.value < minTime ? minTime : e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-gray-600">
              Persone
              <input
                type="number"
                min={1}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value) || 1)}
                className="mt-1 block w-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          {floorPlans.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {floorPlans.map((fp) => (
                <button
                  key={fp.id}
                  type="button"
                  onClick={() => selectFloorPlan(fp.id)}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    fp.id === activeFloorPlanId
                      ? 'bg-brand text-white'
                      : 'border border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  {fp.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-green-200 ring-1 ring-green-600" />
              Disponibile
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-red-200 ring-1 ring-red-600" />
              Occupato
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-gray-200 ring-1 ring-gray-400" />
              Troppo piccolo
            </span>
          </div>

          {activeFloorPlan ? (
            <BookingCanvas
              floorPlan={activeFloorPlan}
              width={activeFloorPlan.width}
              height={activeFloorPlan.height}
            />
          ) : (
            <p className="text-sm text-gray-500">Nessuna piantina disponibile al momento.</p>
          )}
        </>
      )}

      <ReservationForm />
    </div>
  )
}

export default BookingPage
