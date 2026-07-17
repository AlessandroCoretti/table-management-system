import { Circle, Group, Rect, Text } from 'react-konva'

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

const TABLE_COLORS = {
  available: { fill: '#bbf7d0', stroke: '#16a34a' },
  selected: { fill: '#93c5fd', stroke: '#2563eb' },
  occupied: { fill: '#fecaca', stroke: '#dc2626' },
  tooSmall: { fill: '#e5e7eb', stroke: '#9ca3af' },
}

function BookingMapObject({ object, tableNumber, status, isSelected, onSelect }) {
  const isTable = object.type === 'table'

  let fill = object.fill_color || STATIC_FILL[object.type] || '#e5e7eb'
  let stroke = object.stroke_color || STATIC_STROKE[object.type] || '#4b5563'
  let cursor = 'default'

  if (isTable) {
    const colors = isSelected
      ? TABLE_COLORS.selected
      : status === 'tooSmall'
        ? TABLE_COLORS.tooSmall
        : status === 'occupied'
          ? TABLE_COLORS.occupied
          : TABLE_COLORS.available
    fill = colors.fill
    stroke = colors.stroke
    cursor = status === 'available' ? 'pointer' : 'not-allowed'
  }

  const handleClick = () => {
    if (isTable && status === 'available') onSelect(object.id)
  }

  const setCursor = (e, value) => {
    if (!isTable) return
    e.target.getStage().container().style.cursor = value
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
    onMouseEnter: (e) => setCursor(e, cursor),
    onMouseLeave: (e) => setCursor(e, 'default'),
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
          text={isTable ? `TAV.${tableNumber ?? '?'}` : object.label}
          fontSize={13}
          fill="#111827"
          align="center"
          verticalAlign="middle"
          offsetX={20}
          offsetY={12}
          width={40}
          listening={false}
        />
      )}
    </Group>
  )
}

export default BookingMapObject
