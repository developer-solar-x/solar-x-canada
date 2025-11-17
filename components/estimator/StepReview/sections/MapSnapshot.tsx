'use client'

interface MapSnapshotProps {
  mapSnapshot: string
  onImageClick: (image: { src: string; alt: string; title: string }) => void
}

export function MapSnapshot({ mapSnapshot, onImageClick }: MapSnapshotProps) {
  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-semibold text-gray-700 mb-3">Your Roof</h3>
      <div 
        className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors w-full"
        onClick={() => {
          onImageClick({ 
            src: mapSnapshot, 
            alt: 'Roof drawing on satellite map', 
            title: 'Your Traced Roof Outline' 
          })
        }}
        title="Click to view full size"
      >
        <img 
          src={mapSnapshot} 
          alt="Roof drawing on satellite map" 
          className="w-full h-auto max-w-full object-contain"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-navy-500">
          Satellite View
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Click to view full size
      </p>
    </div>
  )
}

