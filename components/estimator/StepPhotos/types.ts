export interface StepPhotosProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export interface PhotoCategory {
  id: string
  name: string
  description: string
  required: boolean
  maxPhotos: number
}

export interface UploadedPhoto {
  id: string
  category: string
  file: File
  preview: string
  uploaded: boolean
  uploadedUrl?: string // Supabase Storage URL after upload
  uploading?: boolean // Upload status
  uploadError?: string // Upload error message
}

export interface CategoryTabsProps {
  categories: PhotoCategory[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  getPhotosForCategory: (categoryId: string) => UploadedPhoto[]
}

export interface UploadAreaProps {
  onFileSelect: (files: File[]) => void
  dragActive: boolean
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  maxPhotos: number
  currentCount: number
}

export interface PhotoThumbnailProps {
  photo: UploadedPhoto
  onRemove: (photoId: string) => void
  onView: (photo: UploadedPhoto) => void
  categoryName: string
}

export interface PhotoSummaryProps {
  categories: PhotoCategory[]
  photos: UploadedPhoto[]
  getPhotosForCategory: (categoryId: string) => UploadedPhoto[]
  hasRequiredPhotos: boolean
  onContinue: () => void
  onSkip: () => void
  onBack?: () => void
}

