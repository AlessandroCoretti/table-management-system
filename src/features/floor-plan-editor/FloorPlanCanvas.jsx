import { useMemo } from 'react'
import { Layer, Rect, Stage } from 'react-konva'
import MapBackgroundImage from '../../components/MapBackgroundImage'
import { buildTableNumbers } from '../../lib/tableNumbering'
import MapObjectShape from './MapObjectShape'
import { useFloorPlanStore } from './floorPlanStore'

function FloorPlanCanvas({ floorPlan, width = 1000, height = 700 }) {
  const objects = useFloorPlanStore((s) => s.objects)
  const tableNumbers = useMemo(() => buildTableNumbers(objects), [objects])
  const selectedId = useFloorPlanStore((s) => s.selectedId)
  const select = useFloorPlanStore((s) => s.select)
  const updateObjectLocal = useFloorPlanStore((s) => s.updateObjectLocal)
  const persistObject = useFloorPlanStore((s) => s.persistObject)
  const backgroundOpacity = useFloorPlanStore((s) => s.backgroundOpacity)

  const handleChange = (id, changes) => {
    updateObjectLocal(id, changes)
    persistObject(id, changes)
  }

  return (
    <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
      <Stage
        width={width}
        height={height}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) select(null)
        }}
      >
        <Layer>
          <Rect x={0} y={0} width={width} height={height} fill="#fafafa" listening={false} />
          {floorPlan?.background_image_url && (
            <MapBackgroundImage
              url={floorPlan.background_image_url}
              width={width}
              height={height}
              opacity={backgroundOpacity}
            />
          )}
          {objects.map((object) => (
            <MapObjectShape
              key={object.id}
              object={object}
              tableNumber={tableNumbers.get(object.id)}
              isSelected={object.id === selectedId}
              onSelect={select}
              onChange={handleChange}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

export default FloorPlanCanvas
