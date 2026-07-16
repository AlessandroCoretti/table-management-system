import { Layer, Rect, Stage } from 'react-konva'
import MapBackgroundImage from '../../components/MapBackgroundImage'
import AdminMapObject from './AdminMapObject'
import { useDashboardStore } from './dashboardStore'

function AdminMapCanvas({ floorPlan, width = 1000, height = 700 }) {
  const objects = useDashboardStore((s) => s.objects)
  const creatingForTableId = useDashboardStore((s) => s.creatingForTableId)
  const selectedReservationId = useDashboardStore((s) => s.selectedReservationId)
  const findOccupyingReservation = useDashboardStore((s) => s.findOccupyingReservation)

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
          {objects.map((object) => {
            const occupying = findOccupyingReservation(object.id)
            const isSelected =
              object.id === creatingForTableId ||
              (occupying && occupying.id === selectedReservationId)
            return <AdminMapObject key={object.id} object={object} isSelected={isSelected} />
          })}
        </Layer>
      </Stage>
    </div>
  )
}

export default AdminMapCanvas
