import { useState } from 'react'
import { useFloorPlanStore } from './floorPlanStore'

const OTHER_ITEMS = [
  { key: 'bar', label: 'Bancone' },
  { key: 'wall', label: 'Parete' },
  { key: 'door', label: 'Porta' },
]

function ObjectPalette() {
  const addObject = useFloorPlanStore((s) => s.addObject)
  const addTable = useFloorPlanStore((s) => s.addTable)

  const [shape, setShape] = useState('circle')
  const [seats, setSeats] = useState(4)

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-end gap-2">
        <div className="flex flex-col text-sm text-gray-600">
          Forma tavolo
          <div className="mt-1 flex overflow-hidden rounded-md border border-gray-300">
            <button
              type="button"
              onClick={() => setShape('circle')}
              className={`px-3 py-1.5 text-sm ${
                shape === 'circle' ? 'bg-brand text-white' : 'bg-white text-gray-700'
              }`}
            >
              Tondo
            </button>
            <button
              type="button"
              onClick={() => setShape('rect')}
              className={`border-l border-gray-300 px-3 py-1.5 text-sm ${
                shape === 'rect' ? 'bg-brand text-white' : 'bg-white text-gray-700'
              }`}
            >
              Quadrato
            </button>
          </div>
        </div>

        <label className="flex flex-col text-sm text-gray-600">
          Posti
          <input
            type="number"
            min={1}
            max={20}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value) || 1)}
            className="mt-1 w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>

        <button
          type="button"
          onClick={() => addTable({ shape, seats }, { x: 150, y: 150 })}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-brand hover:text-brand"
        >
          + Aggiungi tavolo
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-l border-gray-200 pl-4">
        {OTHER_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => addObject(item.key, { x: 150, y: 150 })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-brand hover:text-brand"
          >
            + {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ObjectPalette
