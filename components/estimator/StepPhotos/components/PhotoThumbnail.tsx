'use client'

import { X } from 'lucide-react'
import type { PhotoThumbnailProps } from '../types'

export function PhotoThumbnail({
  photo,
  onRemove,
  onView,
  categoryName,
}: PhotoThumbnailProps) {
  return (
    <div className="relative group min-w-0">
      <div 
        className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => onView(photo)}
        title="Click to view full size"
      >
        <img
          src={photo.preview}
          alt={`${categoryName} photo`}
          className="w-full h-full object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(photo.id)
          }}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 sm:p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1 truncate">
        {photo.file.name}
      </p>
    </div>
  )
}

