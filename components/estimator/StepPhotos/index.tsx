'use client'

// Step: Property Photos Upload

import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ImageModal } from '@/components/ui/ImageModal'
import { deletePhoto } from '@/lib/photo-storage'
import { PhotoUploadSection } from './sections/PhotoUploadSection'
import { PhotoSummary } from './components/PhotoSummary'
import { usePhotoStorage } from './hooks/usePhotoStorage'
import { usePhotoUpload } from './hooks/usePhotoUpload'
import { PHOTO_CATEGORIES } from './constants'
import type { StepPhotosProps, UploadedPhoto } from './types'
import { isValidEmail } from '@/lib/utils'

export function StepPhotos({ data, onComplete, onBack }: StepPhotosProps) {
  const [activeCategory, setActiveCategory] = useState<string>('roof')
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State for image modal
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; title: string } | null>(null)

  const { photos, setPhotos, loading } = usePhotoStorage(data)
  const { dragActive, handleDrag, handleDrop, handleFiles } = usePhotoUpload(photos, setPhotos, activeCategory)

  // Check if required categories have photos
  const hasRequiredPhotos = () => {
    const requiredCategories = PHOTO_CATEGORIES.filter(cat => cat.required)
    return requiredCategories.every(cat => 
      photos.some(photo => photo.category === cat.id)
    )
  }

  // Get photos for specific category
  const getPhotosForCategory = (categoryId: string) => {
    return photos.filter(photo => photo.category === categoryId)
  }

  // Handle file selection from input
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      handleFiles(Array.from(files))
    }
  }

  // Remove photo
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

  // Handle view photo
  const handleViewPhoto = (photo: UploadedPhoto) => {
    const categoryName = PHOTO_CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory
    setSelectedImage({ 
      src: photo.preview, 
      alt: `${categoryName} photo`, 
      title: `${categoryName} - ${photo.file.name}` 
    })
    setImageModalOpen(true)
  }

  const saveProgressToPartialLead = async (stepData: { photos: any[]; photoSummary: any }) => {
    const email = data.email

    // Only save partial leads for detailed HRS residential residential leads
    if (
      !email ||
      !isValidEmail(email) ||
      data.estimatorMode !== 'detailed' ||
      data.programType !== 'hrs_residential' ||
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
          // Logical step index for Photos in detailed flow
          currentStep: 6,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('Failed to save partial lead (Photos):', response.status, err)
      }
    } catch (error) {
      console.error('Failed to save Photos progress (partial lead):', error)
    }
  }

  // In development mode, allow bypassing photo requirement
  const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development'

  // Handle skip (development only)
  const handleSkip = () => {
    if (!isDevelopment) return
    
    const stepData = {
      photos: [],
      photoSummary: {
        total: 0,
        byCategory: PHOTO_CATEGORIES.map(cat => ({
          category: cat.id,
          count: 0,
        })),
      },
    }

    void saveProgressToPartialLead(stepData)
    onComplete(stepData)
  }

  // Handle continue
  const handleContinue = () => {
    // Require at least one photo before continuing (unless in development)
    if (photos.length === 0 && !isDevelopment) {
      setValidationError('Please upload at least one property photo before continuing.')
      return
    }

    // Block continue while any photos are still uploading (unless in development)
    const uploadingPhotos = photos.filter(p => p.uploading)
    if (uploadingPhotos.length > 0 && !isDevelopment) {
      setValidationError('Your photos are still uploading. Please wait a moment and try again.')
      return
    }

    // Block continue if any photos failed to upload or have no Supabase URL (unless in development)
    const notUploaded = photos.filter(p => !p.uploadedUrl)
    if (notUploaded.length > 0 && !isDevelopment) {
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
        byCategory: PHOTO_CATEGORIES.map(cat => ({
          category: cat.id,
          count: getPhotosForCategory(cat.id).length,
        })),
      },
    }

    void saveProgressToPartialLead(stepData)

    onComplete(stepData)
  }

  // Show loading state while loading photos from IndexedDB
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="grid lg:grid-cols-[1fr_320px] gap-4 lg:gap-6">
        {/* Main content - Photo upload */}
        <PhotoUploadSection
          categories={PHOTO_CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          photos={photos}
          getPhotosForCategory={getPhotosForCategory}
          onFileSelect={handleFiles}
          dragActive={dragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          fileInputRef={fileInputRef}
          onRemovePhoto={removePhoto}
          onViewPhoto={handleViewPhoto}
        />
        
        {/* Hidden file input for programmatic access */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          capture="environment"
        />

        {/* Right sidebar - Summary */}
        <PhotoSummary
          categories={PHOTO_CATEGORIES}
          photos={photos}
          getPhotosForCategory={getPhotosForCategory}
          hasRequiredPhotos={hasRequiredPhotos()}
          onContinue={handleContinue}
          onSkip={isDevelopment ? handleSkip : undefined}
          onBack={onBack}
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="max-w-6xl mx-auto mt-4">
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

