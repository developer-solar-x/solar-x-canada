'use client'

import { Camera, CheckCircle, AlertCircle } from 'lucide-react'
import type { PhotoSummaryProps } from '../types'

export function PhotoSummary({
  categories,
  photos,
  getPhotosForCategory,
  hasRequiredPhotos,
  onContinue,
  onSkip,
  onBack,
}: PhotoSummaryProps) {
  return (
    <div className="card p-3 sm:p-4 lg:sticky lg:top-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Camera className="text-red-500 flex-shrink-0" size={20} />
        <h3 className="font-bold text-base sm:text-lg text-navy-500">Photo Summary</h3>
      </div>

      <div className="space-y-2">
        {categories.map(category => {
          const categoryPhotos = getPhotosForCategory(category.id)
          const isComplete = category.required ? categoryPhotos.length > 0 : true
          
          return (
            <div key={category.id} className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isComplete ? (
                  <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                ) : (
                  <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                )}
                <span className="text-xs sm:text-sm text-gray-700 truncate">{category.name}</span>
                {category.required && (
                  <span className="text-xs text-red-500 flex-shrink-0">*</span>
                )}
              </div>
              <span className={`text-xs sm:text-sm font-semibold flex-shrink-0 ${
                categoryPhotos.length > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                {categoryPhotos.length}/{category.maxPhotos}
              </span>
            </div>
          )
        })}

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Total Photos</span>
            <span className="text-lg font-bold text-navy-500">{photos.length}</span>
          </div>
        </div>
      </div>

      {/* Validation message */}
      {!hasRequiredPhotos && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-600">
            <strong>Required:</strong> Please upload at least one photo for Roof and Electrical Panel
          </p>
        </div>
      )}

      {hasRequiredPhotos && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-600">
            <strong>Great!</strong> You've uploaded all required photos
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2 mt-4 sm:mt-6">
        <button
          onClick={onContinue}
          disabled={!hasRequiredPhotos}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2 sm:py-2.5"
        >
          Continue
        </button>
        
        {onBack && (
          <button
            onClick={onBack}
            className="btn-outline border-gray-300 text-gray-700 w-full text-sm sm:text-base py-2 sm:py-2.5"
          >
            Back
          </button>
        )}
      </div>

      {/* Mobile camera tip */}
      <div className="mt-3 sm:mt-4 bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
        <p className="text-xs text-blue-800 break-words">
          <strong>Mobile Tip:</strong> On phone? Click upload and choose "Camera" to take photos directly
        </p>
      </div>
    </div>
  )
}

