export interface StepPhotosSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  onUpgradeMode?: () => void
}

export interface Photo {
  id: string
  file: File
  preview: string
  category: string
  uploadedUrl?: string // Supabase Storage URL after upload
  uploading?: boolean // Upload status
  uploadError?: string // Upload error message
}

export interface SimpleUploadAreaProps {
  onFileSelect: (files: File[]) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  maxPhotos: number
  currentCount: number
}

export interface SimplePhotoThumbnailProps {
  photo: Photo
  index: number
  onRemove: (photoId: string) => void
  onView: (photo: Photo, index: number) => void
}

export interface UpgradePromptProps {
  onUpgrade: () => void
}

