'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function DrawingTips() {
  const [showTips, setShowTips] = useState(false)

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setShowTips(!showTips)}
        className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
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
        <div className="px-4 pb-4">
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Click the <strong>polygon</strong> icon (top-left) to start drawing</li>
            <li>Place points around roof edges; <strong>double‑click</strong> to finish</li>
            <li>To edit: click the shape (red outline), drag corners; drag mid‑edge to add a corner</li>
            <li>Press <strong>Backspace/Delete</strong> to remove the selected corner</li>
            <li>Use the <strong>trash</strong> icon to delete a whole section</li>
            <li>You can draw <strong>multiple polygons</strong> for different roof sections</li>
          </ol>
        </div>
      )}
    </div>
  )
}

