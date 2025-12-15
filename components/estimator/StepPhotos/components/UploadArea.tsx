'use client'

import { Upload } from 'lucide-react'
import type { UploadAreaProps } from '../types'

export function UploadArea({
  onFileSelect,
  dragActive,
  onDrag,
  onDrop,
  fileInputRef,
  maxPhotos,
  currentCount,
}: UploadAreaProps) {
  if (currentCount >= maxPhotos) return null

  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-4 sm:p-5 lg:p-6 text-center cursor-pointer transition-all ${
        dragActive
          ? 'border-red-500 bg-red-50'
          : 'border-gray-300 hover:border-red-500 hover:bg-gray-50'
      }`}
    >
      <Upload className="mx-auto mb-2 sm:mb-3 text-gray-400" size={28} />
      <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 break-words">
        Click to upload or drag and drop
      </p>
      <p className="text-xs text-gray-500 break-words">
        JPG, PNG, HEIC up to 10MB each
      </p>
    </div>
  )
}

