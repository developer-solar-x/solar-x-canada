'use client'

// Easy Mode: Simple Photo Upload

import { useRef, useState } from 'react'
import { Camera, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ImageModal } from '@/components/ui/ImageModal'
import { deletePhoto } from '@/lib/photo-storage'
import { SimpleUploadArea } from './components/SimpleUploadArea'
import { SimplePhotoThumbnail } from './components/SimplePhotoThumbnail'
import { UpgradePrompt } from './components/UpgradePrompt'
import { usePhotoStorage } from './hooks/usePhotoStorage'
import { usePhotoUpload } from './hooks/usePhotoUpload'
import { MAX_PHOTOS } from './constants'
import type { StepPhotosSimpleProps, Photo } from './types'
import { isValidEmail } from '@/lib/utils'

export function StepPhotosSimple({ data, onComplete, onBack, onUpgradeMode }: StepPhotosSimpleProps) {
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State for image modal
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; title: string } | null>(null)

  const { photos, setPhotos, loading } = usePhotoStorage(data)
  const { handleFiles } = usePhotoUpload(photos, setPhotos, MAX_PHOTOS)

  const removePhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId)
    if (photo) {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(photo.preview)
      
      // Delete from IndexedDB
      try {
        await deletePhoto(photoId)
      } catch (error) {
        console.error(`Failed to delete photo ${photoId}:`, error)
      }
    }
    
    // Update UI
    setPhotos(photos.filter(p => p.id !== photoId))
  }

  const handleViewPhoto = (photo: Photo, index: number) => {
    setSelectedImage({ 
      src: photo.uploadedUrl || photo.preview, 
      alt: `Property photo ${index + 1}`, 
      title: `Property Photo ${index + 1} - ${photo.file.name}` 
    })
    setImageModalOpen(true)
  }

  const saveProgressToPartialLead = async (stepData: { photos: any[]; photoSummary: any }) => {
    const email = data.email

    // Save partial leads for quick/easy residential flows (HRS + Net Metering)
    if (
      !email ||
      !isValidEmail(email) ||
      data.estimatorMode !== 'easy' ||
      (data.programType !== 'hrs_residential' && data.programType !== 'quick' && data.programType !== 'net_metering') ||
      data.leadType !== 'residential'
    ) {
      return
    }

    try {
      const response = await fetch('/api/partial-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          estimatorData: {
            ...data,
            ...stepData,
            email,
          },
          // Easy Photos step
          currentStep: 6,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('Failed to save partial lead (Photos Simple):', response.status, err)
      }
    } catch (error) {
      console.error('Failed to save Photos Simple progress (partial lead):', error)
    }
  }

  const handleContinue = () => {
    // Require at least one photo before continuing
    if (photos.length === 0) {
      setValidationError('Please upload at least one property photo before continuing.')
      return
    }

    // Block continue while any photos are still uploading
    const uploadingPhotos = photos.filter(p => p.uploading)
    if (uploadingPhotos.length > 0) {
      setValidationError('Your photos are still uploading. Please wait a moment and try again.')
      return
    }

    // Block continue if any photos failed to upload or have no Supabase URL
    const notUploaded = photos.filter(p => !p.uploadedUrl)
    if (notUploaded.length > 0) {
      setValidationError('Some photos could not be saved. Please re-upload or remove any photos with an error before continuing.')
      return
    }

    // Clear any previous validation error on successful continue
    if (validationError) {
      setValidationError(null)
    }

    const stepData = {
      photos: photos.map(p => ({
        id: p.id,
        category: p.category,
        file: p.file,
        preview: p.preview,
        url: p.uploadedUrl, // Use Supabase URL instead of blob URL
      })),
      photoSummary: {
        total: photos.length,
        byCategory: [{ category: 'general', count: photos.length }],
      }
    }

    void saveProgressToPartialLead(stepData)

    onComplete(stepData)
  }

  // Show loading state while loading photos from IndexedDB
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your photos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-navy-500 mb-2">
            Quick Photos
          </h2>
          <p className="text-gray-600">
            Snap 2-3 photos (optional but helpful)
          </p>
        </div>

        {/* Upload Area */}
        <SimpleUploadArea
          onFileSelect={handleFiles}
          fileInputRef={fileInputRef}
          maxPhotos={MAX_PHOTOS}
          currentCount={photos.length}
        />

        {/* Photo Thumbnails */}
        {photos.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-navy-500">
                {photos.length} Photo{photos.length !== 1 ? 's' : ''} Added
              </h3>
              {photos.length < MAX_PHOTOS && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:underline font-semibold"
                >
                  Add More
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <SimplePhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onRemove={removePhoto}
                  onView={handleViewPhoto}
                />
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {photos.length >= 2 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
            <div>
              <p className="font-semibold text-green-800 text-sm">Great job!</p>
              <p className="text-xs text-green-700">These photos will help us provide a more accurate estimate</p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Mobile Tip:</strong> Photos from your phone work best. We'll ask for more detailed photos later if needed.
          </p>
        </div>

        {/* Upgrade to Detailed */}
        {onUpgradeMode && (
          <UpgradePrompt onUpgrade={onUpgradeMode} />
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="btn-primary w-full"
          >
            Continue {photos.length > 0 && `with ${photos.length} Photo${photos.length !== 1 ? 's' : ''}`}
          </button>
          
          {onBack && (
            <button
              onClick={onBack}
              className="btn-outline border-gray-300 text-gray-700 w-full"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {validationError}
          </div>
        </div>
      )}

      {/* Image Modal for viewing photos in full size */}
      {selectedImage && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          imageSrc={selectedImage.src}
          imageAlt={selectedImage.alt}
          title={selectedImage.title}
        />
      )}
    </div>
  )
}

