import { useFloorPlanStore } from './floorPlanStore'

function PropertiesPanel() {
  const objects = useFloorPlanStore((s) => s.objects)
  const selectedId = useFloorPlanStore((s) => s.selectedId)
  const updateObjectLocal = useFloorPlanStore((s) => s.updateObjectLocal)
  const persistObject = useFloorPlanStore((s) => s.persistObject)
  const deleteSelected = useFloorPlanStore((s) => s.deleteSelected)

  const object = objects.find((o) => o.id === selectedId)

  if (!object) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Seleziona un oggetto sulla piantina per modificarne le proprietà.
      </div>
    )
  }

  const commit = (changes) => {
    updateObjectLocal(object.id, changes)
    persistObject(object.id, changes)
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">Proprietà oggetto</h3>

      <label className="block text-sm text-gray-600">
        Etichetta
        <input
          type="text"
          value={object.label ?? ''}
          onChange={(e) => commit({ label: e.target.value })}
          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </label>

      {object.type === 'table' && (
        <label className="block text-sm text-gray-600">
          Posti
          <input
            type="number"
            min={1}
            value={object.seats ?? ''}
            onChange={(e) => commit({ seats: Number(e.target.value) || null })}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      )}

      <button
        type="button"
        onClick={deleteSelected}
        className="w-full rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        Elimina oggetto
      </button>
    </div>
  )
}

export default PropertiesPanel
