'use client'

import { Camera } from 'lucide-react'
import { CategoryTabs } from '../components/CategoryTabs'
import { UploadArea } from '../components/UploadArea'
import { PhotoThumbnail } from '../components/PhotoThumbnail'
import type { PhotoCategory, UploadedPhoto } from '../types'

interface PhotoUploadSectionProps {
  categories: PhotoCategory[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  photos: UploadedPhoto[]
  getPhotosForCategory: (categoryId: string) => UploadedPhoto[]
  onFileSelect: (files: File[]) => void
  dragActive: boolean
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  onRemovePhoto: (photoId: string) => void
  onViewPhoto: (photo: UploadedPhoto) => void
}

export function PhotoUploadSection({
  categories,
  activeCategory,
  onCategoryChange,
  photos,
  getPhotosForCategory,
  onFileSelect,
  dragActive,
  onDrag,
  onDrop,
  fileInputRef,
  onRemovePhoto,
  onViewPhoto,
}: PhotoUploadSectionProps) {
  const activeCategoryData = categories.find(cat => cat.id === activeCategory)
  const activePhotos = getPhotosForCategory(activeCategory)

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-navy-500 mb-2">
          Property Photos
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Upload photos to help us provide the most accurate estimate
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <Camera className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-xs sm:text-sm text-blue-800 min-w-0">
            <p className="font-semibold mb-1">Why photos matter</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>More accurate system sizing and placement</li>
              <li>Identify potential installation challenges early</li>
              <li>Faster quote turnaround (skip initial site visit)</li>
              <li>Better understanding of your property</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        getPhotosForCategory={getPhotosForCategory}
      />

      {/* Active category info */}
      {activeCategoryData && (
        <div className="card p-3 sm:p-4">
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base text-navy-500 flex items-center gap-2 flex-wrap">
                <span className="break-words">{activeCategoryData.name}</span>
                {activeCategoryData.required && (
                  <span className="text-xs text-red-500 font-normal whitespace-nowrap">Required</span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                {activeCategoryData.description}
              </p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
              {activePhotos.length}/{activeCategoryData.maxPhotos} photos
            </span>
          </div>

          {/* Upload area */}
          <UploadArea
            onFileSelect={onFileSelect}
            dragActive={dragActive}
            onDrag={onDrag}
            onDrop={onDrop}
            fileInputRef={fileInputRef}
            maxPhotos={activeCategoryData.maxPhotos}
            currentCount={activePhotos.length}
          />

          {/* Photo thumbnails */}
          {activePhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mt-4">
              {activePhotos.map(photo => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onRemove={onRemovePhoto}
                  onView={onViewPhoto}
                  categoryName={activeCategoryData.name}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo tips */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-2 text-xs sm:text-sm">Photo Tips</h4>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>Take photos in good lighting (daytime preferred)</li>
          <li>Include multiple angles for roof and electrical panel</li>
          <li>Make sure photos are clear and in focus</li>
          <li>For electrical panel: open door to show breakers clearly</li>
          <li>For roof: capture different sections and close-ups of material</li>
        </ul>
      </div>
    </div>
  )
}

