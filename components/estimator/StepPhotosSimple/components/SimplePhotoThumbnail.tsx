'use client'

import { X, CheckCircle } from 'lucide-react'
import type { SimplePhotoThumbnailProps } from '../types'

export function SimplePhotoThumbnail({
  photo,
  index,
  onRemove,
  onView,
}: SimplePhotoThumbnailProps) {
  return (
    <div className="relative group">
      <div 
        className={`aspect-square relative rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
          photo.uploading 
            ? 'border-yellow-400 bg-yellow-50' 
            : photo.uploadError 
            ? 'border-red-400 bg-red-50' 
            : photo.uploadedUrl 
            ? 'border-green-400 hover:border-blue-500' 
            : 'border-gray-200 hover:border-blue-500'
        }`}
        onClick={() => onView(photo, index)}
        title="Click to view full size"
      >
        <img
          src={photo.uploadedUrl || photo.preview}
          alt="Property photo"
          className="w-full h-full object-cover"
        />
        {photo.uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        {photo.uploadError && (
          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
            <p className="text-white text-xs text-center">Upload failed</p>
          </div>
        )}
        {photo.uploadedUrl && !photo.uploading && (
          <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-1">
            <CheckCircle size={14} />
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(photo.id)
          }}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

