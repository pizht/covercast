import type { SceneElement } from '@/domain'
import { ShapeElementView } from './ShapeElementView'
import { TextElementView } from './TextElementView'
import { ImageElementView } from './ImageElementView'

export function ElementView({
  element,
  idPrefix,
  interactive,
  editingTextId,
  onDoubleClick,
  resolveSrc,
}: {
  element: SceneElement
  idPrefix: string
  interactive: boolean
  editingTextId?: string | null
  onDoubleClick?: (elementId: string) => void
  resolveSrc?: (src: string) => string
}) {
  return (
    <g
      data-element-id={element.id}
      onDoubleClick={() => {
        if (!interactive || element.type !== 'text') {
          return
        }

        onDoubleClick?.(element.id)
      }}
    >
      {renderElement(element, idPrefix, interactive, editingTextId, resolveSrc)}
    </g>
  )
}

function renderElement(
  element: SceneElement,
  idPrefix: string,
  interactive: boolean,
  editingTextId?: string | null,
  resolveSrc?: (src: string) => string,
) {
  if (element.type === 'text') {
    return (
      <TextElementView
        element={element}
        interactive={interactive}
        editing={editingTextId === element.id}
      />
    )
  }

  if (element.type === 'image') {
    return (
      <ImageElementView
        element={element}
        idPrefix={idPrefix}
        interactive={interactive}
        resolveSrc={resolveSrc}
      />
    )
  }

  return <ShapeElementView element={element} idPrefix={idPrefix} />
}
