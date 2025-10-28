'use client'

// Modal component specifically designed for displaying images in full size

import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  imageAlt?: string
  title?: string
}

export function ImageModal({
  isOpen,
  onClose,
  imageSrc,
  imageAlt = 'Image',
  title,
}: ImageModalProps) {
  // State for zoom level
  const [zoom, setZoom] = useState(1)
  
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    // Cleanup function to remove event listener and restore scroll
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Reset zoom when modal closes
  useEffect(() => {
    if (!isOpen) {
      setZoom(1)
    }
  }, [isOpen])

  // Don't render anything if modal is not open
  if (!isOpen) return null

  // Handle zoom in action
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  // Handle zoom out action
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  // Handle download action
  const handleDownload = () => {
    // Create a temporary link element to trigger download
    const link = document.createElement('a')
    link.href = imageSrc
    link.download = imageAlt || 'image'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - semi-transparent black background */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div className="relative w-full h-full flex flex-col">
        {/* Header with controls */}
        <div className="relative z-10 flex items-center justify-between p-4 bg-black/50 backdrop-blur-md">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-white truncate">
                {title}
              </h3>
            )}
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center gap-2">
            {/* Zoom out button */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            
            {/* Zoom level indicator */}
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            {/* Zoom in button */}
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
            
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Download image"
              title="Download image"
            >
              <Download size={20} />
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
              aria-label="Close modal"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Image container with scroll support for zoomed images */}
        <div className="relative flex-1 overflow-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            {/* Image wrapper with zoom transform */}
            <div 
              className="transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center center'
              }}
            >
              {/* Check if image is a data URL or external URL */}
              {imageSrc.startsWith('data:') || imageSrc.startsWith('blob:') ? (
                // Use regular img tag for data URLs and blob URLs
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  style={{ 
                    maxWidth: 'calc(100vw - 2rem)',
                  }}
                />
              ) : (
                // Use Next.js Image component for regular URLs
                <div className="relative">
                  <Image
                    src={imageSrc}
                    alt={imageAlt}
                    width={1200}
                    height={800}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    style={{ 
                      maxWidth: 'calc(100vw - 2rem)',
                      width: 'auto',
                      height: 'auto'
                    }}
                    unoptimized={imageSrc.startsWith('http')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with image info */}
        <div className="relative z-10 p-4 bg-black/50 backdrop-blur-md">
          <p className="text-sm text-white/70 text-center">
            Click outside or press ESC to close
          </p>
        </div>
      </div>
    </div>
  )
}

