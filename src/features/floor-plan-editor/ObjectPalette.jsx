import { useFloorPlanStore } from './floorPlanStore'

const PALETTE_ITEMS = [
  { key: 'table_round_2', label: 'Tavolo tondo 2p' },
  { key: 'table_round_4', label: 'Tavolo tondo 4p' },
  { key: 'table_rect_4', label: 'Tavolo rett. 4p' },
  { key: 'table_rect_6', label: 'Tavolo rett. 6p' },
  { key: 'bar', label: 'Bancone' },
  { key: 'wall', label: 'Parete' },
  { key: 'door', label: 'Porta' },
]

function ObjectPalette() {
  const addObject = useFloorPlanStore((s) => s.addObject)

  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE_ITEMS.map((item) => (
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
  )
}

export default ObjectPalette
