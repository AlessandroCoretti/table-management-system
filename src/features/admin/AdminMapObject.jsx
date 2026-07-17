import { Circle, Group, Rect, Text } from 'react-konva'
import { useDashboardStore } from './dashboardStore'

const STATIC_FILL = {
  wall: '#6b7280',
  door: '#b45309',
  bar: '#fde68a',
}
const STATIC_STROKE = {
  wall: '#374151',
  door: '#92400e',
  bar: '#b45309',
}

function AdminMapObject({ object, tableNumber, isSelected }) {
  const reservation = useDashboardStore((s) => s.findOccupyingReservation(object.id))
  const selectTableOnMap = useDashboardStore((s) => s.selectTableOnMap)
  const isTable = object.type === 'table'

  let fill = object.fill_color || STATIC_FILL[object.type] || '#e5e7eb'
  let stroke = object.stroke_color || STATIC_STROKE[object.type] || '#4b5563'

  if (isTable) {
    if (isSelected) {
      fill = '#93c5fd'
      stroke = '#2563eb'
    } else if (reservation) {
      fill = '#fecaca'
      stroke = '#dc2626'
    } else {
      fill = '#bbf7d0'
      stroke = '#16a34a'
    }
  }

  const handleClick = () => {
    if (isTable) selectTableOnMap(object.id)
  }

  const commonProps = {
    x: object.x,
    y: object.y,
    rotation: object.rotation,
    fill,
    stroke,
    strokeWidth: isSelected ? 3 : 1.5,
    onClick: handleClick,
    onTap: handleClick,
    onMouseEnter: (e) => {
      if (isTable) e.target.getStage().container().style.cursor = 'pointer'
    },
    onMouseLeave: (e) => {
      e.target.getStage().container().style.cursor = 'default'
    },
  }

  return (
    <Group>
      {object.shape === 'circle' ? (
        <Circle {...commonProps} radius={object.width / 2} />
      ) : (
        <Rect
          {...commonProps}
          width={object.width}
          height={object.height}
          offsetX={object.width / 2}
          offsetY={object.height / 2}
          cornerRadius={4}
        />
      )}
      {(isTable || object.label) && (
        <Text
          x={object.x}
          y={object.y}
          text={
            isTable
              ? reservation
                ? `TAV.${tableNumber ?? '?'}\n${reservation.customer_name.split(' ')[0]}`
                : `TAV.${tableNumber ?? '?'}`
              : object.label
          }
          fontSize={12}
          fill="#111827"
          align="center"
          verticalAlign="middle"
          offsetX={25}
          offsetY={12}
          width={50}
          listening={false}
        />
      )}
    </Group>
  )
}

export default AdminMapObject
