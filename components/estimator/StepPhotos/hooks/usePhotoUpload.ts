import { useState } from 'react'
import { savePhoto } from '@/lib/photo-storage'
import { PHOTO_CATEGORIES } from '../constants'
import type { UploadedPhoto } from '../types'

export function usePhotoUpload(
  photos: UploadedPhoto[],
  setPhotos: React.Dispatch<React.SetStateAction<UploadedPhoto[]>>,
  activeCategory: string
) {
  const [dragActive, setDragActive] = useState(false)

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

  const handleFiles = async (files: File[]) => {
    const activePhotos = photos.filter(p => p.category === activeCategory)
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
      uploading: true,
    }))

    // Update UI immediately
    setPhotos([...photos, ...newPhotos])

    // Upload each photo to Supabase Storage and save to IndexedDB
    for (const photo of newPhotos) {
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
                ? { ...p, uploadedUrl: uploadResult.data.url, uploaded: true, uploading: false }
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

  return {
    dragActive,
    handleDrag,
    handleDrop,
    handleFiles,
  }
}

