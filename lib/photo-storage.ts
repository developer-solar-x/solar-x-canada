// IndexedDB Photo Storage
// Handles storing and retrieving photo files for the estimator

const DB_NAME = 'solarx_photos'
const DB_VERSION = 1
const STORE_NAME = 'photos'

// Photo data structure for IndexedDB
export interface StoredPhoto {
  id: string
  category: string
  blob: Blob
  fileName: string
  fileType: string
  fileSize: number
  timestamp: number
}

// Photo metadata for passing between components (without the blob)
export interface PhotoMetadata {
  id: string
  category: string
  fileName: string
  fileType: string
  fileSize: number
  preview?: string // Created on load with URL.createObjectURL
}

/**
 * Initialize IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'))
      return
    }

    // Open database connection
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    // Create object store on first initialization or version upgrade
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Create photos object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        // Create index for querying by category
        objectStore.createIndex('category', 'category', { unique: false })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    // Handle successful connection
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    // Handle connection errors
    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error)
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

/**
 * Save a photo to IndexedDB
 */
export async function savePhoto(
  id: string,
  file: File,
  category: string
): Promise<void> {
  try {
    const db = await openDatabase()

    // Create stored photo object
    const storedPhoto: StoredPhoto = {
      id,
      category,
      blob: file,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      timestamp: Date.now(),
    }

    // Save to IndexedDB
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(storedPhoto)

      request.onsuccess = () => {
        console.log(`✅ Photo saved to IndexedDB: ${id}`)
        resolve()
      }

      request.onerror = () => {
        console.error(`❌ Failed to save photo: ${id}`, request.error)
        reject(request.error)
      }

      // Close database connection when transaction completes
      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('Failed to save photo:', error)
    throw error
  }
}

/**
 * Save multiple photos to IndexedDB
 */
export async function savePhotos(
  photos: Array<{ id: string; file: File; category: string }>
): Promise<void> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      let successCount = 0
      let errorCount = 0

      // Save each photo
      photos.forEach(({ id, file, category }) => {
        const storedPhoto: StoredPhoto = {
          id,
          category,
          blob: file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          timestamp: Date.now(),
        }

        const request = store.put(storedPhoto)
        
        request.onsuccess = () => {
          successCount++
        }
        
        request.onerror = () => {
          errorCount++
          console.error(`❌ Failed to save photo: ${id}`, request.error)
        }
      })

      // Handle transaction completion
      transaction.oncomplete = () => {
        console.log(`✅ Saved ${successCount} photos to IndexedDB`)
        if (errorCount > 0) {
          console.warn(`⚠️ ${errorCount} photos failed to save`)
        }
        db.close()
        resolve()
      }

      // Handle transaction errors
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error)
        db.close()
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error('Failed to save photos:', error)
    throw error
  }
}

/**
 * Load a single photo from IndexedDB
 */
export async function loadPhoto(id: string): Promise<StoredPhoto | null> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => {
        const photo = request.result as StoredPhoto | undefined
        resolve(photo || null)
      }

      request.onerror = () => {
        console.error(`Failed to load photo: ${id}`, request.error)
        reject(request.error)
      }

      // Close database connection when transaction completes
      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('Failed to load photo:', error)
    return null
  }
}

/**
 * Load all photos from IndexedDB
 */
export async function loadAllPhotos(): Promise<StoredPhoto[]> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const photos = request.result as StoredPhoto[]
        console.log(`✅ Loaded ${photos.length} photos from IndexedDB`)
        resolve(photos)
      }

      request.onerror = () => {
        console.error('Failed to load photos:', request.error)
        reject(request.error)
      }

      // Close database connection when transaction completes
      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('Failed to load photos:', error)
    return []
  }
}

/**
 * Delete a photo from IndexedDB
 */
export async function deletePhoto(id: string): Promise<void> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        console.log(`✅ Photo deleted from IndexedDB: ${id}`)
        resolve()
      }

      request.onerror = () => {
        console.error(`Failed to delete photo: ${id}`, request.error)
        reject(request.error)
      }

      // Close database connection when transaction completes
      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('Failed to delete photo:', error)
    throw error
  }
}

/**
 * Delete all photos from IndexedDB
 */
export async function clearAllPhotos(): Promise<void> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('🗑️ All photos cleared from IndexedDB')
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to clear photos:', request.error)
        reject(request.error)
      }

      // Close database connection when transaction completes
      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('Failed to clear photos:', error)
    throw error
  }
}

/**
 * Convert StoredPhoto to File object for form submission
 */
export function storedPhotoToFile(storedPhoto: StoredPhoto): File {
  return new File([storedPhoto.blob], storedPhoto.fileName, {
    type: storedPhoto.fileType,
  })
}

/**
 * Convert StoredPhoto to PhotoMetadata with preview URL
 */
export function storedPhotoToMetadata(storedPhoto: StoredPhoto): PhotoMetadata {
  return {
    id: storedPhoto.id,
    category: storedPhoto.category,
    fileName: storedPhoto.fileName,
    fileType: storedPhoto.fileType,
    fileSize: storedPhoto.fileSize,
    preview: URL.createObjectURL(storedPhoto.blob),
  }
}

/**
 * Get total storage size used by photos
 */
export async function getPhotosStorageSize(): Promise<number> {
  try {
    const photos = await loadAllPhotos()
    return photos.reduce((total, photo) => total + photo.fileSize, 0)
  } catch (error) {
    console.error('Failed to calculate storage size:', error)
    return 0
  }
}

/**
 * Get photo count
 */
export async function getPhotoCount(): Promise<number> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.count()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('Failed to get photo count:', error)
    return 0
  }
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.indexedDB
}

