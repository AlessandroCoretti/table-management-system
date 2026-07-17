import { useMemo } from 'react'
import { Layer, Rect, Stage } from 'react-konva'
import MapBackgroundImage from '../../components/MapBackgroundImage'
import { buildTableNumbers } from '../../lib/tableNumbering'
import BookingMapObject from './BookingMapObject'
import { useBookingStore } from './bookingStore'

function BookingCanvas({ floorPlan, width = 1000, height = 700 }) {
  const objects = useBookingStore((s) => s.objects)
  const tableNumbers = useMemo(() => buildTableNumbers(objects), [objects])
  const occupiedTableIds = useBookingStore((s) => s.occupiedTableIds)
  const partySize = useBookingStore((s) => s.partySize)
  const selectedTableId = useBookingStore((s) => s.selectedTableId)
  const selectTable = useBookingStore((s) => s.selectTable)

  const getStatus = (object) => {
    if (object.type !== 'table') return null
    if (object.seats != null && object.seats < partySize) return 'tooSmall'
    if (occupiedTableIds.includes(object.id)) return 'occupied'
    return 'available'
  }

  return (
    <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
      <Stage width={width} height={height}>
        <Layer>
          <Rect x={0} y={0} width={width} height={height} fill="#fafafa" listening={false} />
          {floorPlan?.background_image_url && (
            <MapBackgroundImage
              url={floorPlan.background_image_url}
              width={width}
              height={height}
              opacity={0.5}
            />
          )}
          {objects.map((object) => (
            <BookingMapObject
              key={object.id}
              object={object}
              tableNumber={tableNumbers.get(object.id)}
              status={getStatus(object)}
              isSelected={object.id === selectedTableId}
              onSelect={selectTable}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

export default BookingCanvas
