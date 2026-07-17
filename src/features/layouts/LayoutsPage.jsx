import { useEffect, useState } from 'react'
import { useFloorPlanStore } from '../floor-plan-editor/floorPlanStore'

function LayoutsPage() {
  const init = useFloorPlanStore((s) => s.init)
  const loading = useFloorPlanStore((s) => s.loading)
  const error = useFloorPlanStore((s) => s.error)
  const floorPlans = useFloorPlanStore((s) => s.floorPlans)
  const activeFloorPlanId = useFloorPlanStore((s) => s.activeFloorPlanId)
  const selectFloorPlan = useFloorPlanStore((s) => s.selectFloorPlan)
  const layouts = useFloorPlanStore((s) => s.layouts)
  const dateOverrides = useFloorPlanStore((s) => s.dateOverrides)
  const createLayout = useFloorPlanStore((s) => s.createLayout)
  const renameLayout = useFloorPlanStore((s) => s.renameLayout)
  const setDefaultLayout = useFloorPlanStore((s) => s.setDefaultLayout)
  const deleteLayout = useFloorPlanStore((s) => s.deleteLayout)
  const setDateOverride = useFloorPlanStore((s) => s.setDateOverride)
  const removeDateOverride = useFloorPlanStore((s) => s.removeDateOverride)

  const [newLayoutName, setNewLayoutName] = useState('')
  const [duplicateSourceId, setDuplicateSourceId] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [overrideDate, setOverrideDate] = useState(new Date().toISOString().slice(0, 10))
  const [overrideLayoutId, setOverrideLayoutId] = useState('')

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (layouts.length && !overrideLayoutId) {
      setOverrideLayoutId(layouts[0].id)
    }
  }, [layouts, overrideLayoutId])

  const activeFloorPlan = floorPlans.find((fp) => fp.id === activeFloorPlanId)
  const layoutNameById = (id) => layouts.find((l) => l.id === id)?.name ?? 'n/d'

  const handleCreateLayout = (e) => {
    e.preventDefault()
    if (!newLayoutName.trim()) return
    createLayout(newLayoutName.trim(), {
      duplicateFromLayoutId: duplicateSourceId || undefined,
    })
    setNewLayoutName('')
    setDuplicateSourceId('')
  }

  const handleDeleteLayout = (layout) => {
    if (window.confirm(`Eliminare la disposizione "${layout.name}"?`)) {
      deleteLayout(layout.id)
    }
  }

  const handleSaveOverride = (e) => {
    e.preventDefault()
    if (!overrideLayoutId) return
    setDateOverride(overrideDate, overrideLayoutId)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Disposizioni tavoli</h1>
        <p className="mt-1 text-sm text-gray-500">
          Crea più disposizioni per ogni sala: una predefinita usata tutti i giorni, e altre
          assegnabili a giorni specifici (es. un evento che richiede di spostare i tavoli).
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Caricamento…</p>}

      {!loading && !error && (
        <>
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

          {activeFloorPlan && (
            <>
              <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Disposizioni salvate — {activeFloorPlan.name}
                </h2>

                <div className="divide-y divide-gray-100">
                  {layouts.map((layout) => (
                    <div key={layout.id} className="flex items-center justify-between gap-2 py-2">
                      {renamingId === layout.id ? (
                        <form
                          className="flex flex-1 items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault()
                            if (renameValue.trim()) renameLayout(layout.id, renameValue.trim())
                            setRenamingId(null)
                          }}
                        >
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                          <button type="submit" className="text-sm text-brand hover:text-brand-dark">
                            Salva
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingId(null)}
                            className="text-sm text-gray-400 hover:text-gray-600"
                          >
                            Annulla
                          </button>
                        </form>
                      ) : (
                        <span className="text-sm text-gray-800">
                          {layout.name}
                          {layout.is_default && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                              Predefinita
                            </span>
                          )}
                        </span>
                      )}

                      {renamingId !== layout.id && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingId(layout.id)
                              setRenameValue(layout.name)
                            }}
                            className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            Rinomina
                          </button>
                          {!layout.is_default && (
                            <button
                              type="button"
                              onClick={() => setDefaultLayout(layout.id)}
                              className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              Imposta come predefinita
                            </button>
                          )}
                          {!layout.is_default && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLayout(layout)}
                              className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Elimina
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <form className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3" onSubmit={handleCreateLayout}>
                  <label className="text-sm text-gray-600">
                    Nuova disposizione
                    <input
                      type="text"
                      value={newLayoutName}
                      onChange={(e) => setNewLayoutName(e.target.value)}
                      placeholder="Es. Disposizione evento"
                      className="mt-1 block rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-sm text-gray-600">
                    Parti da
                    <select
                      value={duplicateSourceId}
                      onChange={(e) => setDuplicateSourceId(e.target.value)}
                      className="mt-1 block rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="">Disposizione vuota</option>
                      {layouts.map((l) => (
                        <option key={l.id} value={l.id}>
                          Copia di "{l.name}"
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
                  >
                    Crea
                  </button>
                </form>
              </section>

              <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Disposizioni per giorni specifici</h2>
                <p className="text-xs text-gray-500">
                  Assegna una disposizione diversa a una data precisa: quel giorno la piantina
                  userà quella disposizione al posto di quella predefinita.
                </p>

                <form className="flex flex-wrap items-end gap-2" onSubmit={handleSaveOverride}>
                  <label className="text-sm text-gray-600">
                    Data
                    <input
                      type="date"
                      value={overrideDate}
                      onChange={(e) => setOverrideDate(e.target.value)}
                      className="mt-1 block rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-sm text-gray-600">
                    Disposizione
                    <select
                      value={overrideLayoutId}
                      onChange={(e) => setOverrideLayoutId(e.target.value)}
                      className="mt-1 block rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      {layouts.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
                  >
                    Salva per questa data
                  </button>
                </form>

                {dateOverrides.length > 0 && (
                  <div className="divide-y divide-gray-100 border-t border-gray-100 pt-2">
                    {dateOverrides.map((override) => (
                      <div key={override.id} className="flex items-center justify-between py-1.5 text-sm">
                        <span>
                          {new Date(`${override.date}T00:00:00`).toLocaleDateString('it-IT', {
                            dateStyle: 'full',
                          })}{' '}
                          → {layoutNameById(override.layout_id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDateOverride(override.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Rimuovi (torna alla predefinita)
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default LayoutsPage
