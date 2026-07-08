/**
 * @file Element selection state and operations.
 *
 * Inspired by Excalidraw's selection architecture, using Record<string, true>
 * for O(1) lookup performance. All operations return new state objects
 * rather than mutating in place.
 */

/**
 * Selection state using a map for efficient lookups.
 * Mirrors Excalidraw's AppState.selectedElementIds structure.
 */
export type SelectionState = {
  selectedIds: Record<string, true>
}

/**
 * Creates an empty selection state.
 * @returns A `SelectionState` with no selected ids.
 */
export function createSelectionState(): SelectionState {
  return {
    selectedIds: {},
  }
}

/**
 * Replaces the current selection with a single element.
 * @param state - The current selection state.
 * @param elementId - The id to select.
 * @returns A new `SelectionState` containing only `elementId`.
 */
export function selectSingle(state: SelectionState, elementId: string): SelectionState {
  return {
    ...state,
    selectedIds: { [elementId]: true },
  }
}

/**
 * Toggles an element's membership in the selection.
 * @param state - The current selection state.
 * @param elementId - The id to add or remove.
 * @returns A new `SelectionState` with the element added or removed.
 */
export function toggleSelection(state: SelectionState, elementId: string): SelectionState {
  if (state.selectedIds[elementId]) {
    const { [elementId]: _, ...rest } = state.selectedIds
    return {
      ...state,
      selectedIds: rest,
    }
  }

  return {
    ...state,
    selectedIds: {
      ...state.selectedIds,
      [elementId]: true,
    },
  }
}

/**
 * Clears the selection. Returns the input state unchanged when already empty.
 * @param state - The current selection state.
 * @returns A new `SelectionState` with an empty id map.
 */
export function clearSelection(state: SelectionState): SelectionState {
  if (Object.keys(state.selectedIds).length === 0) {
    return state
  }

  return {
    ...state,
    selectedIds: {},
  }
}

/**
 * Returns whether an element is currently selected.
 * @param state - The current selection state.
 * @param elementId - The id to check.
 * @returns `true` when the element is selected.
 */
export function isSelected(state: SelectionState, elementId: string): boolean {
  return state.selectedIds[elementId] === true
}

/**
 * Returns the number of currently selected elements.
 * @param state - The current selection state.
 * @returns The selection count.
 */
export function getSelectedCount(state: SelectionState): number {
  return Object.keys(state.selectedIds).length
}

/**
 * Returns whether any element is currently selected.
 * @param state - The current selection state.
 * @returns `true` when at least one element is selected.
 */
export function hasSelection(state: SelectionState): boolean {
  return Object.keys(state.selectedIds).length > 0
}

/**
 * Returns the first selected id, or `null` when nothing is selected.
 * @param state - The current selection state.
 * @returns The first selected id or `null`.
 */
export function getFirstSelectedId(state: SelectionState): string | null {
  const ids = Object.keys(state.selectedIds)
  return ids[0] ?? null
}

/**
 * Returns all selected ids as an array.
 * @param state - The current selection state.
 * @returns Array of selected element ids.
 */
export function getSelectedIds(state: SelectionState): string[] {
  return Object.keys(state.selectedIds)
}

/**
 * Handles a click on an element, taking modifier keys into account.
 * With shift pressed, toggles the element; otherwise selects it as the
 * single active selection (no-op when it is already the only selection).
 * @param state - The current selection state.
 * @param elementId - The clicked element's id.
 * @param isShiftPressed - Whether shift was held during the click.
 * @returns A new `SelectionState` reflecting the click result.
 */
export function handleElementClick(
  state: SelectionState,
  elementId: string,
  isShiftPressed: boolean,
): SelectionState {
  if (isShiftPressed) {
    return toggleSelection(state, elementId)
  }

  if (state.selectedIds[elementId] && Object.keys(state.selectedIds).length === 1) {
    return state
  }

  return selectSingle(state, elementId)
}

/**
 * Replaces or extends the selection with multiple element ids.
 * With shift pressed, ids are appended to the existing selection (deduped);
 * otherwise the selection is replaced by `elementIds`.
 * @param state - The current selection state.
 * @param elementIds - The ids to select.
 * @param isShiftPressed - Whether shift was held during the operation.
 * @returns A new `SelectionState` reflecting the result.
 */
export function selectMultiple(
  state: SelectionState,
  elementIds: string[],
  isShiftPressed: boolean,
): SelectionState {
  if (isShiftPressed) {
    const newIds = { ...state.selectedIds }
    for (const id of elementIds) {
      newIds[id] = true
    }
    return {
      ...state,
      selectedIds: newIds,
    }
  }

  return {
    ...state,
    selectedIds: elementIds.reduce(
      (acc, id) => {
        acc[id] = true
        return acc
      },
      {} as Record<string, true>,
    ),
  }
}

/**
 * Returns previous selectedIds if no change, to retain reference identity
 * for memoization. Similar to Excalidraw's makeNextSelectedElementIds.
 * @param nextSelectedIds - The new selection map.
 * @param prevState - The previous state.
 * @returns The previous selectedIds if identical, otherwise nextSelectedIds.
 */
export function makeNextSelectedIds(
  nextSelectedIds: Record<string, true>,
  prevState: SelectionState,
): Record<string, true> {
  const prevKeys = Object.keys(prevState.selectedIds)
  const nextKeys = Object.keys(nextSelectedIds)

  if (prevKeys.length !== nextKeys.length) {
    return nextSelectedIds
  }

  for (const key of prevKeys) {
    if (!nextSelectedIds[key]) {
      return nextSelectedIds
    }
  }

  return prevState.selectedIds
}

/**
 * Helper: filter elements that are selected.
 * @param elements - Array of elements with id property.
 * @param state - The selection state.
 * @returns Array of selected elements.
 */
export function filterSelectedElements<T extends { id: string }>(
  elements: readonly T[],
  state: SelectionState,
): T[] {
  return elements.filter((el) => state.selectedIds[el.id])
}

/**
 * Helper: filter elements that are NOT selected.
 * @param elements - Array of elements with id property.
 * @param state - The selection state.
 * @returns Array of non-selected elements.
 */
export function filterNonSelectedElements<T extends { id: string }>(
  elements: readonly T[],
  state: SelectionState,
): T[] {
  return elements.filter((el) => !state.selectedIds[el.id])
}

/**
 * Helper: check if any of the given elements are selected.
 * @param elements - Array of elements with id property.
 * @param state - The selection state.
 * @returns True if at least one element is selected.
 */
export function someElementSelected<T extends { id: string }>(
  elements: readonly T[],
  state: SelectionState,
): boolean {
  return elements.some((el) => state.selectedIds[el.id])
}
