'use client'

/**
 * Panel Editor Controls
 * Toolbar for formation presets, orientation, spacing, and panel manipulation
 */

import {
  Grid3X3,
  LayoutGrid,
  Rows3,
  RotateCcw,
  RotateCw,
  Trash2,
  Plus,
  RefreshCw,
  Magnet,
  Grid,
  RectangleVertical,
  RectangleHorizontal,
  Minus,
} from 'lucide-react'
import type { PanelFormation, PanelOrientation } from './types'

interface PanelEditorControlsProps {
  formation: PanelFormation
  orientation: PanelOrientation
  spacing: number
  snapToGrid: boolean
  showGrid: boolean
  selectedCount: number
  totalCount: number
  onFormationChange: (formation: PanelFormation) => void
  onOrientationChange: (orientation: PanelOrientation) => void
  onSpacingChange: (spacing: number) => void
  onSnapToGridChange: (enabled: boolean) => void
  onShowGridChange: (show: boolean) => void
  onAddPanel: () => void
  onDeleteSelected: () => void
  onRotateSelected: (degrees: number) => void
  onReset: () => void
}

export function PanelEditorControls({
  formation,
  orientation,
  spacing,
  snapToGrid,
  showGrid,
  selectedCount,
  totalCount,
  onFormationChange,
  onOrientationChange,
  onSpacingChange,
  onSnapToGridChange,
  onShowGridChange,
  onAddPanel,
  onDeleteSelected,
  onRotateSelected,
  onReset,
}: PanelEditorControlsProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 mb-3 space-y-3">
      {/* Formation Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Formation
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onFormationChange('grid')}
            className={`p-2 rounded-md transition-colors ${
              formation === 'grid'
                ? 'bg-navy-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Grid Layout"
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => onFormationChange('staggered')}
            className={`p-2 rounded-md transition-colors ${
              formation === 'staggered'
                ? 'bg-navy-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Staggered/Brick Layout"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => onFormationChange('diagonal')}
            className={`p-2 rounded-md transition-colors ${
              formation === 'diagonal'
                ? 'bg-navy-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Diagonal Layout"
          >
            <Rows3 size={18} className="rotate-45" />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Orientation */}
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Panel
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onOrientationChange('portrait')}
            className={`p-2 rounded-md transition-colors ${
              orientation === 'portrait'
                ? 'bg-navy-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Portrait Orientation"
          >
            <RectangleVertical size={18} />
          </button>
          <button
            onClick={() => onOrientationChange('landscape')}
            className={`p-2 rounded-md transition-colors ${
              orientation === 'landscape'
                ? 'bg-navy-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Landscape Orientation"
          >
            <RectangleHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Spacing Control */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Spacing
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSpacingChange(Math.max(0, spacing - 2))}
            className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Decrease Spacing"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-medium w-8 text-center">{spacing}px</span>
          <button
            onClick={() => onSpacingChange(Math.min(20, spacing + 2))}
            className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Increase Spacing"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Snap & Grid toggles */}
        <button
          onClick={() => onSnapToGridChange(!snapToGrid)}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
            snapToGrid
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Snap to Grid"
        >
          <Magnet size={14} />
          Snap
        </button>
        <button
          onClick={() => onShowGridChange(!showGrid)}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
            showGrid
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Show Grid"
        >
          <Grid size={14} />
          Grid
        </button>
      </div>

      {/* Panel Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onAddPanel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-navy-500 text-white text-xs font-medium hover:bg-navy-600 transition-colors"
            title="Add Panel"
          >
            <Plus size={14} />
            Add
          </button>

          {selectedCount > 0 && (
            <>
              <button
                onClick={() => onRotateSelected(-15)}
                className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Rotate Left 15°"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => onRotateSelected(15)}
                className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Rotate Right 15°"
              >
                <RotateCw size={16} />
              </button>
              <button
                onClick={onDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-100 text-red-600 text-xs font-medium hover:bg-red-200 transition-colors"
                title="Delete Selected"
              >
                <Trash2 size={14} />
                Delete ({selectedCount})
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Panel count */}
          <div className="text-sm">
            <span className="text-gray-500">Panels:</span>{' '}
            <span className="font-semibold text-navy-600">{totalCount}</span>
          </div>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
            title="Reset Layout"
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Selection hint */}
      {selectedCount === 0 && (
        <div className="text-xs text-gray-500 text-center">
          Click a panel to select. Hold Shift/Ctrl for multi-select. Drag corners to resize.
        </div>
      )}
    </div>
  )
}
