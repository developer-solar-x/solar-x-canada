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
        className="inline-flex items-center justify-center rounded-full hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-colors bg-white/20 backdrop-blur-sm"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More information"
        suppressHydrationWarning
      >
        <Info size={iconSize} className="text-white drop-shadow-md" />
      </button>
      
      {isOpen && (
        <div
          className="absolute z-[100] w-64 p-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-xl pointer-events-auto"
          style={{
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="whitespace-normal">{content}</div>
          {/* Arrow */}
          <div
            className="absolute w-2 h-2 bg-white border-r border-b border-gray-200"
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

