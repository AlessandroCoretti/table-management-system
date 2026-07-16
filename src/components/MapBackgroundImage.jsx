import { Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'

function MapBackgroundImage({ url, width, height, opacity }) {
  const [image] = useImage(url)
  if (!image) return null
  return (
    <KonvaImage image={image} width={width} height={height} opacity={opacity} listening={false} />
  )
}

export default MapBackgroundImage
