'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function DrawingTips() {
  const [showTips, setShowTips] = useState(true)

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex flex-col">
      <button
        onClick={() => setShowTips(!showTips)}
        className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-gray-100 transition-colors flex-shrink-0"
      >
        <h3 className="font-semibold text-navy-500">
          Drawing & Edit Tips
        </h3>
        {showTips ? (
          <ChevronUp size={20} className="text-navy-500" />
        ) : (
          <ChevronDown size={20} className="text-navy-500" />
        )}
      </button>
      
      {showTips && (
        <div className="px-4 pb-4 overflow-y-auto flex-1" style={{ maxHeight: '300px' }}>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Drawing Roof Sections</h4>
              <ol className="space-y-1.5 list-decimal list-inside ml-1">
                <li>Click the <strong>square</strong> icon (top-left of the map) to start drawing</li>
                <li>Click around the edges of each roof section where you want solar panels installed</li>
                <li><strong>Double‑click</strong> to finish a section</li>
                <li>Click the square icon again to draw additional sections if needed</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Editing Your Drawing</h4>
              <ul className="space-y-1.5 list-disc list-inside ml-1">
                <li><strong>Move corners:</strong> Click a shape to select it, then drag any corner</li>
                <li><strong>Add corners:</strong> Drag the middle of any edge to create a new corner</li>
                <li><strong>Delete a corner:</strong> Right‑click on the corner, or select it and press <strong>Backspace/Delete</strong></li>
                <li><strong>Delete entire section:</strong> Click the <strong>trash</strong> icon when a section is selected</li>
                <li><strong>Undo/Redo:</strong> Use the arrow buttons below or press <strong>Ctrl+Z</strong> / <strong>Ctrl+Y</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

