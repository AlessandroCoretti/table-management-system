import { useEffect, useRef } from 'react'
import { Circle, Group, Rect, Text, Transformer } from 'react-konva'

const FILL_BY_TYPE = {
  table: '#fef3c7',
  bar: '#ddd6fe',
  wall: '#6b7280',
  door: '#b45309',
}

const STROKE_BY_TYPE = {
  table: '#d97706',
  bar: '#7c3aed',
  wall: '#374151',
  door: '#92400e',
}

function MapObjectShape({ object, isSelected, onSelect, onChange }) {
  const shapeRef = useRef(null)
  const transformerRef = useRef(null)

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  const fill = FILL_BY_TYPE[object.type] ?? '#e5e7eb'
  const stroke = STROKE_BY_TYPE[object.type] ?? '#4b5563'

  const commonProps = {
    ref: shapeRef,
    x: object.x,
    y: object.y,
    rotation: object.rotation,
    draggable: true,
    fill,
    stroke,
    strokeWidth: isSelected ? 3 : 1.5,
    onClick: () => onSelect(object.id),
    onTap: () => onSelect(object.id),
    onDragEnd: (e) => {
      onChange(object.id, { x: e.target.x(), y: e.target.y() })
    },
    onTransformEnd: () => {
      const node = shapeRef.current
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      node.scaleX(1)
      node.scaleY(1)
      onChange(object.id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(20, object.width * scaleX),
        height: Math.max(20, object.height * scaleY),
      })
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
      {object.label && (
        <Text
          x={object.x}
          y={object.y}
          text={object.seats ? `${object.label}\n${object.seats}p` : object.label}
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
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
          ]}
        />
      )}
    </Group>
  )
}

export default MapObjectShape
