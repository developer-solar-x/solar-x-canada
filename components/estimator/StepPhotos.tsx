'use client'

// Step: Property Photos Upload

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Camera, CheckCircle, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ImageModal } from '@/components/ui/ImageModal'
import { savePhoto, deletePhoto, loadAllPhotos, storedPhotoToFile, storedPhotoToMetadata } from '@/lib/photo-storage'

interface StepPhotosProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

interface PhotoCategory {
  id: string
  name: string
  description: string
  required: boolean
  maxPhotos: number
}

interface UploadedPhoto {
  id: string
  category: string
  file: File
  preview: string
  uploaded: boolean
}

const PHOTO_CATEGORIES: PhotoCategory[] = [
  {
    id: 'roof',
    name: 'Roof Photos',
    description: 'Multiple angles of your roof, including close-ups of shingles/material',
    required: true,
    maxPhotos: 5,
  },
  {
    id: 'electrical',
    name: 'Electrical Panel',
    description: 'Main electrical distribution box (open panel door to show breakers)',
    required: true,
    maxPhotos: 2,
  },
  {
    id: 'meter',
    name: 'Electric Meter',
    description: 'Your utility meter location and current reading',
    required: false,
    maxPhotos: 2,
  },
  {
    id: 'attic',
    name: 'Attic Access',
    description: 'Access point to attic/crawl space (for wiring)',
    required: false,
    maxPhotos: 2,
  },
  {
    id: 'obstructions',
    name: 'Obstructions',
    description: 'Chimneys, vents, skylights, or other roof features',
    required: false,
    maxPhotos: 3,
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Any other relevant photos',
    required: false,
    maxPhotos: 3,
  },
]

export function StepPhotos({ data, onComplete, onBack }: StepPhotosProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('roof')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
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
        
        // Convert stored photos to UploadedPhoto format
        const loadedPhotos: UploadedPhoto[] = storedPhotos.map(stored => ({
          id: stored.id,
          category: stored.category,
          file: storedPhotoToFile(stored),
          preview: URL.createObjectURL(stored.blob),
          uploaded: true,
        }))
        
        setPhotos(loadedPhotos)
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

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      handleFiles(Array.from(files))
    }
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Process selected files
  const handleFiles = async (files: File[]) => {
    const activePhotos = getPhotosForCategory(activeCategory)
    const category = PHOTO_CATEGORIES.find(cat => cat.id === activeCategory)
    
    if (!category) return

    // Check if we've reached max photos for this category
    const availableSlots = category.maxPhotos - activePhotos.length
    const filesToProcess = files.slice(0, availableSlots)

    const newPhotos: UploadedPhoto[] = filesToProcess.map(file => ({
      id: `${activeCategory}-${Date.now()}-${Math.random()}`,
      category: activeCategory,
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
    }))

    // Update UI immediately
    setPhotos([...photos, ...newPhotos])

    // Save each photo to IndexedDB in the background
    for (const photo of newPhotos) {
      try {
        await savePhoto(photo.id, photo.file, photo.category)
      } catch (error) {
        console.error(`Failed to save photo ${photo.id}:`, error)
      }
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

  // Handle continue
  const handleContinue = () => {
    onComplete({
      photos: photos,
      photoSummary: {
        total: photos.length,
        byCategory: PHOTO_CATEGORIES.map(cat => ({
          category: cat.id,
          count: getPhotosForCategory(cat.id).length,
        })),
      }
    })
  }

  // Skip photos (allow but warn)
  const handleSkip = () => {
    setShowSkipModal(true)
  }

  // Confirm skip
  const confirmSkip = () => {
    onComplete({ photos: [], photoSummary: { total: 0, byCategory: [] } })
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
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content - Photo upload */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-navy-500 mb-2">
              Property Photos
            </h2>
            <p className="text-gray-600">
              Upload photos to help us provide the most accurate estimate
            </p>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Camera className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
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
          <div className="flex gap-2 overflow-x-auto pb-2">
            {PHOTO_CATEGORIES.map(category => {
              const categoryPhotos = getPhotosForCategory(category.id)
              const isComplete = category.required ? categoryPhotos.length > 0 : true
              
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    activeCategory === category.id
                      ? 'bg-red-500 text-white'
                      : isComplete
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : category.required
                      ? 'bg-gray-100 text-gray-600 border border-gray-200'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {category.name}
                  {categoryPhotos.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      activeCategory === category.id ? 'bg-white/20' : 'bg-white'
                    }`}>
                      {categoryPhotos.length}
                    </span>
                  )}
                  {category.required && categoryPhotos.length === 0 && (
                    <span className="text-red-500">*</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Active category info */}
          {PHOTO_CATEGORIES.find(cat => cat.id === activeCategory) && (
            <div className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-navy-500 flex items-center gap-2">
                    {PHOTO_CATEGORIES.find(cat => cat.id === activeCategory)?.name}
                    {PHOTO_CATEGORIES.find(cat => cat.id === activeCategory)?.required && (
                      <span className="text-xs text-red-500 font-normal">Required</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {PHOTO_CATEGORIES.find(cat => cat.id === activeCategory)?.description}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {getPhotosForCategory(activeCategory).length}/{PHOTO_CATEGORIES.find(cat => cat.id === activeCategory)?.maxPhotos} photos
                </span>
              </div>

              {/* Upload area */}
              {getPhotosForCategory(activeCategory).length < (PHOTO_CATEGORIES.find(cat => cat.id === activeCategory)?.maxPhotos || 0) && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-red-500 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="mx-auto mb-3 text-gray-400" size={48} />
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, HEIC up to 10MB each
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

              {/* Photo thumbnails */}
              {getPhotosForCategory(activeCategory).length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {getPhotosForCategory(activeCategory).map(photo => (
                    <div key={photo.id} className="relative group">
                      <div 
                        className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => {
                          // Open image in modal when thumbnail is clicked
                          const categoryName = PHOTO_CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory
                          setSelectedImage({ 
                            src: photo.preview, 
                            alt: `${categoryName} photo`, 
                            title: `${categoryName} - ${photo.file.name}` 
                          })
                          setImageModalOpen(true)
                        }}
                        title="Click to view full size"
                      >
                        <img
                          src={photo.preview}
                          alt={`${activeCategory} photo`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            // Stop propagation to prevent opening modal when deleting
                            e.stopPropagation()
                            removePhoto(photo.id)
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {photo.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Photo tips */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Photo Tips</h4>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Take photos in good lighting (daytime preferred)</li>
              <li>Include multiple angles for roof and electrical panel</li>
              <li>Make sure photos are clear and in focus</li>
              <li>For electrical panel: open door to show breakers clearly</li>
              <li>For roof: capture different sections and close-ups of material</li>
            </ul>
          </div>
        </div>

        {/* Right sidebar - Summary */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="text-red-500" size={24} />
              <h3 className="font-bold text-navy-500">Photo Summary</h3>
            </div>

            <div className="space-y-3">
              {PHOTO_CATEGORIES.map(category => {
                const categoryPhotos = getPhotosForCategory(category.id)
                const isComplete = category.required ? categoryPhotos.length > 0 : true
                
                return (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle className="text-green-500" size={16} />
                      ) : (
                        <AlertCircle className="text-red-500" size={16} />
                      )}
                      <span className="text-sm text-gray-700">{category.name}</span>
                      {category.required && (
                        <span className="text-xs text-red-500">*</span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${
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
            {!hasRequiredPhotos() && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-600">
                  <strong>Required:</strong> Please upload at least one photo for Roof and Electrical Panel
                </p>
              </div>
            )}

            {hasRequiredPhotos() && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-600">
                  <strong>Great!</strong> You've uploaded all required photos
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 mt-6">
              <button
                onClick={handleContinue}
                disabled={!hasRequiredPhotos()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
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

            {/* Mobile camera tip */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Mobile Tip:</strong> On phone? Click upload and choose "Camera" to take photos directly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Skip Photos Confirmation Modal */}
      <Modal
        isOpen={showSkipModal}
        onClose={() => setShowSkipModal(false)}
        onConfirm={confirmSkip}
        title="Skip Photo Upload?"
        message="Skipping photos may result in a less accurate estimate and could require an additional site visit. Are you sure you want to continue without uploading photos?"
        confirmText="Yes, Skip Photos"
        cancelText="No, Upload Photos"
        variant="warning"
      >
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Photos help us provide accurate quotes faster and may eliminate the need for an initial site visit.
          </p>
        </div>
      </Modal>

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

