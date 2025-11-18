'use client'

import { Camera } from 'lucide-react'
import type { SimpleUploadAreaProps } from '../types'

export function SimpleUploadArea({
  onFileSelect,
  fileInputRef,
  maxPhotos,
  currentCount,
}: SimpleUploadAreaProps) {
  if (currentCount >= maxPhotos) return null

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onFileSelect(Array.from(files))
    }
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all mb-6"
    >
      <Camera className="mx-auto mb-4 text-gray-400" size={64} />
      <p className="text-lg font-semibold text-gray-700 mb-2">
        Tap to Take Photos
      </p>
      <p className="text-sm text-gray-600 mb-4">
        We need photos of:
      </p>
      <ul className="text-sm text-gray-600 space-y-1 max-w-xs mx-auto">
        <li>1. Your roof (any angle)</li>
        <li>2. Electrical panel</li>
        <li>3. (Optional) Any other relevant photos</li>
      </ul>
      <p className="text-xs text-gray-500 mt-4">
        Up to {maxPhotos} photos • JPG, PNG, HEIC
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        capture="environment"
      />
    </div>
  )
}

