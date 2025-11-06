'use client'

// Easy Mode: Simple Photo Upload

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, CheckCircle, ArrowRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ImageModal } from '@/components/ui/ImageModal'
import { savePhoto, deletePhoto, loadAllPhotos, storedPhotoToFile } from '@/lib/photo-storage'

interface StepPhotosSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  onUpgradeMode?: () => void
}

interface Photo {
  id: string
  file: File
  preview: string
  category: string
  uploadedUrl?: string // Supabase Storage URL after upload
  uploading?: boolean // Upload status
  uploadError?: string // Upload error message
}

export function StepPhotosSimple({ data, onComplete, onBack, onUpgradeMode }: StepPhotosSimpleProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State for image modal
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; title: string } | null>(null)

  // Load photos from IndexedDB on mount
  useEffect(() => {
    const loadSavedPhotos = async () => {
      try {
        setLoading(true)
        const storedPhotos = await loadAllPhotos()
        
        // Convert stored photos to Photo format
        const loadedPhotos: Photo[] = storedPhotos.map(stored => ({
          id: stored.id,
          category: stored.category,
          file: storedPhotoToFile(stored),
          preview: URL.createObjectURL(stored.blob),
        }))
        
        // If nothing in IndexedDB and we have an email, try to restore from partial lead
        if (loadedPhotos.length === 0 && data?.email) {
          try {
            const res = await fetch(`/api/partial-lead?email=${encodeURIComponent(data.email)}`)
            if (res.ok) {
              const json = await res.json()
              const estimator = json?.data?.estimator_data
              const urls: string[] = json?.data?.photo_urls || (Array.isArray(estimator?.photos) ? estimator.photos.map((p: any) => p.url || p.uploadedUrl || p.preview).filter(Boolean) : [])
              if (urls && urls.length > 0) {
                const restored: Photo[] = urls.map((url: string, idx: number) => ({
                  id: `restored-${idx}-${Date.now()}`,
                  category: 'general',
                  // Create a placeholder File; UI uses preview/uploadedUrl for display
                  file: new File([], 'photo.jpg', { type: 'image/jpeg' }),
                  preview: url,
                  uploadedUrl: url,
                }))
                setPhotos(restored)
              } else {
                setPhotos(loadedPhotos)
              }
            } else {
              setPhotos(loadedPhotos)
            }
          } catch {
            setPhotos(loadedPhotos)
          }
        } else {
          setPhotos(loadedPhotos)
        }
        console.log(`Loaded ${loadedPhotos.length} photos from IndexedDB`)
      } catch (error) {
        console.error('Failed to load photos:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSavedPhotos()
    
    // Cleanup: Revoke all object URLs when component unmounts
    return () => {
      photos.forEach(photo => {
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview)
        }
      })
    }
  }, []) // Empty dependency array - run only on mount

  // Auto-save uploaded URLs to partial lead when available (debounced)
  useEffect(() => {
    if (!data?.email) return
    const urls = photos.map(p => p.uploadedUrl).filter(Boolean) as string[]
    if (urls.length === 0) return
    const timer = setTimeout(async () => {
      try {
        await fetch('/api/partial-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            estimatorData: {
              ...data,
              photos: photos.map(p => ({ id: p.id, category: p.category, url: p.uploadedUrl || p.preview })),
              photoSummary: {
                total: photos.length,
                byCategory: [{ category: 'general', count: photos.length }],
              },
            },
            currentStep: 3,
          }),
        })
      } catch (e) {
        console.warn('Failed to autosave photos to draft', e)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [photos, data])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newPhotos: Photo[] = Array.from(files).slice(0, 5 - photos.length).map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        category: 'general',
        uploading: true,
      }))
      
      // Update UI immediately
      setPhotos([...photos, ...newPhotos])
      
      // Upload each photo to Supabase Storage and save to IndexedDB
      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i]
        try {
          // Upload to Supabase Storage
          const uploadFormData = new FormData()
          uploadFormData.append('file', photo.file)
          uploadFormData.append('category', photo.category)
          
          const uploadResponse = await fetch('/api/upload-photo', {
            method: 'POST',
            body: uploadFormData,
          })
          
          if (!uploadResponse.ok) {
            throw new Error('Upload failed')
          }
          
          const uploadResult = await uploadResponse.json()
          
          if (uploadResult.success && uploadResult.data?.url) {
            // Update photo with uploaded URL
            setPhotos(prevPhotos => 
              prevPhotos.map(p => 
                p.id === photo.id 
                  ? { ...p, uploadedUrl: uploadResult.data.url, uploading: false }
                  : p
              )
            )
            
            // Save to IndexedDB as backup
            await savePhoto(photo.id, photo.file, photo.category)
          } else {
            throw new Error('No URL returned from upload')
          }
        } catch (error) {
          console.error(`Failed to upload photo ${photo.id}:`, error)
          // Mark as failed but keep in UI
          setPhotos(prevPhotos => 
            prevPhotos.map(p => 
              p.id === photo.id 
                ? { ...p, uploading: false, uploadError: error instanceof Error ? error.message : 'Upload failed' }
                : p
            )
          )
        }
      }
    }
  }

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

  const handleContinue = () => {
    // Filter photos that have been successfully uploaded
    const uploadedPhotos = photos.filter(p => p.uploadedUrl)
    
    // Warn if some photos failed to upload
    const failedPhotos = photos.filter(p => p.uploadError)
    if (failedPhotos.length > 0) {
      console.warn(`${failedPhotos.length} photo(s) failed to upload, but continuing anyway`)
    }
    
    onComplete({
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
    })
  }

  const handleSkip = () => {
    setShowSkipModal(true)
  }

  const confirmSkip = () => {
    onComplete({ photos: [], photoSummary: { total: 0, byCategory: [] } })
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
        {photos.length < 5 && (
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
              Up to 5 photos • JPG, PNG, HEIC
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              capture="environment"
            />
          </div>
        )}

        {/* Photo Thumbnails */}
        {photos.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-navy-500">
                {photos.length} Photo{photos.length !== 1 ? 's' : ''} Added
              </h3>
              {photos.length < 5 && (
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
                <div key={photo.id} className="relative group">
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
                    onClick={() => {
                      // Open image in modal when thumbnail is clicked
                      setSelectedImage({ 
                        src: photo.uploadedUrl || photo.preview, 
                        alt: `Property photo ${index + 1}`, 
                        title: `Property Photo ${index + 1} - ${photo.file.name}` 
                      })
                      setImageModalOpen(true)
                    }}
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
                        // Stop propagation to prevent opening modal when deleting
                        e.stopPropagation()
                        removePhoto(photo.id)
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
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
          <div className="bg-gradient-to-r from-navy-50 to-blue-50 border border-navy-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-navy-500 mb-1 text-sm">Need to organize photos by category?</h4>
                <p className="text-xs text-gray-700 mb-2">
                  Switch to detailed mode for organized photo upload with categories
                </p>
                <button
                  onClick={onUpgradeMode}
                  className="text-sm text-navy-600 hover:underline font-semibold flex items-center gap-1"
                >
                  Use Advanced Photo Upload
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="btn-primary w-full"
          >
            Continue {photos.length > 0 && `with ${photos.length} Photo${photos.length !== 1 ? 's' : ''}`}
          </button>
          
          <button
            onClick={handleSkip}
            className="btn-outline border-gray-300 text-gray-700 w-full text-sm"
          >
            Skip Photos
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

      {/* Skip Confirmation Modal */}
      <Modal
        isOpen={showSkipModal}
        onClose={() => setShowSkipModal(false)}
        onConfirm={confirmSkip}
        title="Skip Photos?"
        message="Photos help us provide more accurate estimates. You can always add them later, but it may require an additional site visit."
        confirmText="Yes, Skip for Now"
        cancelText="No, Add Photos"
        variant="warning"
      />

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

