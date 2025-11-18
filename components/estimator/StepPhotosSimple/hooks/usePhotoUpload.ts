import { savePhoto } from '@/lib/photo-storage'
import type { Photo } from '../types'

export function usePhotoUpload(
  photos: Photo[],
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>,
  maxPhotos: number
) {
  const handleFiles = async (files: File[]) => {
    const newPhotos: Photo[] = Array.from(files).slice(0, maxPhotos - photos.length).map(file => ({
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

  return {
    handleFiles,
  }
}

