import { useMemo } from 'react'
import type { MeasurementGuide } from '@/domain'

export function useVisibleGuides(
  spacingGuides: MeasurementGuide[],
  selectedIds: string[],
  guidesSelectedIds: string[],
) {
  const visibleSpacingGuides = useMemo(
    () =>
      spacingGuides.filter((guide) => {
        if (!guide.mode) return true
        if (guide.mode === 'keyboard') {
          return (
            guidesSelectedIds.length === selectedIds.length &&
            guidesSelectedIds.every((id) => selectedIds.includes(id))
          )
        }
        return true
      }),
    [spacingGuides, selectedIds, guidesSelectedIds],
  )

  return { visibleSpacingGuides }
}
