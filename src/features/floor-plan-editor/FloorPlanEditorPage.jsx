import { useEffect, useState } from 'react'
import FloorPlanCanvas from './FloorPlanCanvas'
import ObjectPalette from './ObjectPalette'
import PropertiesPanel from './PropertiesPanel'
import { useFloorPlanStore } from './floorPlanStore'

function FloorPlanEditorPage() {
  const init = useFloorPlanStore((s) => s.init)
  const loading = useFloorPlanStore((s) => s.loading)
  const error = useFloorPlanStore((s) => s.error)
  const floorPlans = useFloorPlanStore((s) => s.floorPlans)
  const activeFloorPlanId = useFloorPlanStore((s) => s.activeFloorPlanId)
  const selectFloorPlan = useFloorPlanStore((s) => s.selectFloorPlan)
  const createFloorPlan = useFloorPlanStore((s) => s.createFloorPlan)
  const deleteFloorPlan = useFloorPlanStore((s) => s.deleteFloorPlan)
  const countReservationsForFloorPlan = useFloorPlanStore((s) => s.countReservationsForFloorPlan)
  const uploadBackground = useFloorPlanStore((s) => s.uploadBackground)
  const removeBackground = useFloorPlanStore((s) => s.removeBackground)
  const backgroundOpacity = useFloorPlanStore((s) => s.backgroundOpacity)
  const setBackgroundOpacity = useFloorPlanStore((s) => s.setBackgroundOpacity)

  const [newRoomName, setNewRoomName] = useState('')

  useEffect(() => {
    init()
  }, [init])

  const activeFloorPlan = floorPlans.find((fp) => fp.id === activeFloorPlanId)

  const handleDeleteActiveFloorPlan = async () => {
    if (!activeFloorPlan) return
    const reservationCount = await countReservationsForFloorPlan(activeFloorPlan.id)
    const message =
      reservationCount > 0
        ? `Attenzione: la sala "${activeFloorPlan.name}" ha ${reservationCount} prenotazione/i collegate ai suoi tavoli. Eliminandola verranno cancellate anche quelle prenotazioni. Continuare?`
        : `Eliminare la sala "${activeFloorPlan.name}" e tutti i suoi tavoli?`
    if (window.confirm(message)) {
      deleteFloorPlan(activeFloorPlan.id)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Editor piantina</h1>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Caricamento…</p>}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-center gap-2">
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
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault()
                if (!newRoomName.trim()) return
                createFloorPlan(newRoomName.trim())
                setNewRoomName('')
              }}
            >
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Nuova sala…"
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
              <button
                type="submit"
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:border-brand hover:text-brand"
              >
                Aggiungi
              </button>
            </form>
          </div>

          {activeFloorPlan && (
            <>
              <ObjectPalette />

              <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  Immagine di sfondo (foto/planimetria del locale)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadBackground(file)
                    }}
                    className="text-sm"
                  />
                </label>
                {activeFloorPlan.background_image_url && (
                  <>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      Opacità sfondo
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={backgroundOpacity}
                        onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Rimuovere l\'immagine di sfondo di questa sala?')) {
                          removeBackground()
                        }
                      }}
                      className="rounded-md border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Rimuovi sfondo
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <div className="min-w-0 flex-1">
                  <FloorPlanCanvas
                    floorPlan={activeFloorPlan}
                    width={activeFloorPlan.width}
                    height={activeFloorPlan.height}
                  />
                </div>
                <div className="w-64 shrink-0">
                  <PropertiesPanel />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={handleDeleteActiveFloorPlan}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Elimina sala "{activeFloorPlan.name}"
                </button>
              </div>
            </>
          )}

          {!activeFloorPlan && floorPlans.length === 0 && (
            <p className="text-sm text-gray-500">
              Crea la prima sala con il modulo sopra per iniziare a disegnare la piantina.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default FloorPlanEditorPage
