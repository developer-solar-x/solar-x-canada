'use client'

/**
 * Panel Editor - Main Export
 *
 * Interactive solar panel layout editor with:
 * - Drag & drop panels
 * - Rotation and resize
 * - Formation presets (grid, staggered, diagonal)
 * - Portrait/Landscape orientation
 * - Snap-to-grid
 */

export { PanelEditor } from './PanelEditor'
export { PanelEditorControls } from './PanelEditorControls'
export { PanelEditorModal } from './PanelEditorModal'
export { SolarPanel } from './SolarPanel'
export type {
  PanelData,
  PanelEditorProps,
  PanelFormation,
  PanelOrientation,
  PanelEditorState,
  FormationConfig,
} from './types'
