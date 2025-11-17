'use client'

interface PhotosSummaryProps {
  photos: any[]
  photoSummary?: any
  onImageClick: (image: { src: string; alt: string; title: string }) => void
}

export function PhotosSummary({ photos, photoSummary, onImageClick }: PhotosSummaryProps) {
  if (!photos || photos.length === 0) return null

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-gray-700 mb-2">Property Photos</h3>
      <div className="text-sm text-gray-600 space-y-1">
        <p>Total Photos: {photos.length}</p>
        {photoSummary?.byCategory?.map((cat: any) => (
          cat.count > 0 && (
            <p key={cat.category} className="text-xs capitalize">
              {cat.category}: {cat.count}
            </p>
          )
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 mt-2">
        {photos.slice(0, 6).map((photo: any, idx: number) => (
          <div 
            key={idx} 
            className="aspect-square relative rounded overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => {
              const categoryLabel = photo.category ? ` (${photo.category})` : ''
              onImageClick({ 
                src: photo.preview, 
                alt: `Property photo ${idx + 1}`, 
                title: `Property Photo ${idx + 1}${categoryLabel}` 
              })
            }}
            title="Click to view full size"
          >
            <img 
              src={photo.preview} 
              alt={`Property ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      {photos.length > 6 && (
        <p className="text-xs text-gray-500 mt-1 text-center">
          +{photos.length - 6} more photos
        </p>
      )}
    </div>
  )
}

