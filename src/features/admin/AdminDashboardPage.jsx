import { useEffect } from 'react'
import AdminMapCanvas from './AdminMapCanvas'
import ReservationDetailPanel from './ReservationDetailPanel'
import ReservationList from './ReservationList'
import WalkInForm from './WalkInForm'
import { useAuthStore } from './authStore'
import { useDashboardStore } from './dashboardStore'

function AdminDashboardPage() {
  const init = useDashboardStore((s) => s.init)
  const loading = useDashboardStore((s) => s.loading)
  const error = useDashboardStore((s) => s.error)
  const floorPlans = useDashboardStore((s) => s.floorPlans)
  const activeFloorPlanId = useDashboardStore((s) => s.activeFloorPlanId)
  const selectFloorPlan = useDashboardStore((s) => s.selectFloorPlan)
  const selectedDate = useDashboardStore((s) => s.selectedDate)
  const setSelectedDate = useDashboardStore((s) => s.setSelectedDate)
  const viewTime = useDashboardStore((s) => s.viewTime)
  const setViewTime = useDashboardStore((s) => s.setViewTime)
  const selectedReservationId = useDashboardStore((s) => s.selectedReservationId)
  const creatingForTableId = useDashboardStore((s) => s.creatingForTableId)
  const signOut = useAuthStore((s) => s.signOut)

  useEffect(() => {
    init()
  }, [init])

  const activeFloorPlan = floorPlans.find((fp) => fp.id === activeFloorPlanId)

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard prenotazioni</h1>
        <button
          type="button"
          onClick={signOut}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Esci
        </button>
      </div>

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
              Giorno
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-gray-600">
              Visualizza stato alle ore
              <input
                type="time"
                value={viewTime}
                onChange={(e) => setViewTime(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <p className="max-w-xs text-xs text-gray-400">
              La piantina mostra i tavoli occupati/liberi in questo preciso orario. Cliccando una
              prenotazione dalla lista, l'orario si allinea automaticamente a quella prenotazione.
            </p>
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

          <div className="flex gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              {activeFloorPlan ? (
                <AdminMapCanvas
                  floorPlan={activeFloorPlan}
                  width={activeFloorPlan.width}
                  height={activeFloorPlan.height}
                />
              ) : (
                <p className="text-sm text-gray-500">Nessuna piantina disponibile.</p>
              )}
              <p className="text-xs text-gray-500">
                Clicca un tavolo libero (verde) per creare una prenotazione manuale, o uno
                occupato (rosso) per vederne i dettagli.
              </p>
            </div>

            <div className="w-80 shrink-0 space-y-4">
              {creatingForTableId && <WalkInForm />}
              {selectedReservationId && <ReservationDetailPanel />}
              {!creatingForTableId && !selectedReservationId && (
                <>
                  <h2 className="text-sm font-semibold text-gray-900">Prenotazioni del giorno</h2>
                  <ReservationList />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboardPage
