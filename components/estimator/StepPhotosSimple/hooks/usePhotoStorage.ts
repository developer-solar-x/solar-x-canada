import { useState, useEffect } from 'react'
import { loadAllPhotos, storedPhotoToFile } from '@/lib/photo-storage'
import type { Photo } from '../types'

export function usePhotoStorage(data: any) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

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
        
        // Partial leads feature disabled
        // If nothing in IndexedDB and we have an email, try to restore from partial lead
        // if (loadedPhotos.length === 0 && data?.email) {
        //   try {
        //     const res = await fetch(`/api/partial-lead?email=${encodeURIComponent(data.email)}`)
        //     if (res.ok) {
        //       const json = await res.json()
        //       const estimator = json?.data?.estimator_data
        //       const urls: string[] = json?.data?.photo_urls || (Array.isArray(estimator?.photos) ? estimator.photos.map((p: any) => p.url || p.uploadedUrl || p.preview).filter(Boolean) : [])
        //       if (urls && urls.length > 0) {
        //         const restored: Photo[] = urls.map((url: string, idx: number) => ({
        //           id: `restored-${idx}-${Date.now()}`,
        //           category: 'general',
        //           // Create a placeholder File; UI uses preview/uploadedUrl for display
        //           file: new File([], 'photo.jpg', { type: 'image/jpeg' }),
        //           preview: url,
        //           uploadedUrl: url,
        //         }))
        //         setPhotos(restored)
        //       } else {
        //         setPhotos(loadedPhotos)
        //       }
        //     } else {
        //       setPhotos(loadedPhotos)
        //     }
        //   } catch {
        //     setPhotos(loadedPhotos)
        //   }
        // } else {
        //   setPhotos(loadedPhotos)
        // }
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

  // Partial leads feature disabled
  // Auto-save uploaded URLs to partial lead when available (debounced)
  // useEffect(() => {
  //   if (!data?.email) return
  //   const urls = photos.map(p => p.uploadedUrl).filter(Boolean) as string[]
  //   if (urls.length === 0) return
  //   const timer = setTimeout(async () => {
  //     try {
  //       await fetch('/api/partial-lead', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           email: data.email,
  //           estimatorData: {
  //             ...data,
  //             photos: photos.map(p => ({ id: p.id, category: p.category, url: p.uploadedUrl || p.preview })),
  //             photoSummary: {
  //               total: photos.length,
  //               byCategory: [{ category: 'general', count: photos.length }],
  //             },
  //           },
  //           currentStep: 3,
  //         }),
  //       })
  //     } catch (e) {
  //       console.warn('Failed to autosave photos to draft', e)
  //     }
  //   }, 800)
  //   return () => clearTimeout(timer)
  // }, [photos, data])

  return {
    photos,
    setPhotos,
    loading,
  }
}

