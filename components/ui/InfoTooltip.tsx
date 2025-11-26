'use client'

// Simple info tooltip component that shows explanation text on hover

import { useState } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  content: string
  className?: string
  iconSize?: number
}

export function InfoTooltip({ content, className = '', iconSize = 16 }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More information"
      >
        <Info size={iconSize} className="text-blue-500" />
      </button>
      
      {isOpen && (
        <div
          className="absolute z-50 w-64 p-3 mt-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg pointer-events-none"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="whitespace-normal">{content}</div>
          {/* Arrow */}
          <div
            className="absolute w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45"
            style={{
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
            }}
          />
        </div>
      )}
    </div>
  )
}

