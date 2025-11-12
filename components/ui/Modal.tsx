'use client'

// Reusable modal component

import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'info' | 'warning' | 'danger' | 'success'
  children?: React.ReactNode
}

export function Modal({
  isOpen, // Keep track of whether the modal should show
  onClose, // Allow the modal to close when needed
  onConfirm, // Optional confirm action when relevant
  title, // Simple text for the modal heading
  message, // Friendly paragraph that explains the content
  confirmText = 'Confirm', // Default text for the confirm button
  cancelText = 'Cancel', // Default text for the cancel button
  variant = 'info', // Style hint so colors feel consistent
  children, // Optional extra content such as tables or lists
}: ModalProps) {
  // Remember the user's scroll position so we can restore it after closing the dialog
  const scrollPositionRef = useRef(0)
  // Dynamically offset the modal so it opens close to where the user was interacting
  const [modalMarginTop, setModalMarginTop] = useState(64)

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      scrollPositionRef.current = window.scrollY // Save where the viewer currently is
      // Keep the modal within the viewport while nudging it near the trigger point
      const preferredTop = window.scrollY - window.innerHeight * 0.15
      setModalMarginTop(
        Math.max(48, Math.min(preferredTop, window.scrollY + window.innerHeight * 0.25))
      )
      document.body.style.position = 'fixed' // Lock the body so it does not shift
      document.body.style.top = `-${scrollPositionRef.current}px` // Counteract the natural jump to the top
      document.body.style.left = '0' // Keep the layout anchored to the left edge
      document.body.style.right = '0' // Keep the layout anchored to the right edge
      document.body.style.width = '100%' // Prevent any horizontal shrink
      document.body.style.overflow = 'hidden' // Hide scrollbars while the modal is active
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.position = '' // Allow the body to behave normally again
      document.body.style.top = '' // Clear the temporary top offset
      document.body.style.left = '' // Clear the temporary left lock
      document.body.style.right = '' // Clear the temporary right lock
      document.body.style.width = '' // Reset the width to default behaviour
      document.body.style.overflow = 'unset' // Restore scrolling
      window.scrollTo(0, scrollPositionRef.current) // Return the viewer to their original spot
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Get colors based on variant
  const variantStyles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      button: 'bg-blue-500 hover:bg-blue-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-500',
      button: 'bg-yellow-500 hover:bg-yellow-600',
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      button: 'bg-red-500 hover:bg-red-600',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      button: 'bg-green-500 hover:bg-green-600',
    },
  }

  const styles = variantStyles[variant]

  // Variant-specific cancel button styling (brand palette)
  const cancelBtnByVariant: Record<string, string> = {
    info: 'text-navy-600 bg-white border border-navy-200 hover:bg-navy-50',
    warning: 'text-yellow-700 bg-white border border-yellow-300 hover:bg-yellow-50',
    danger: 'text-navy-600 bg-white border border-red-300 hover:bg-red-50',
    success: 'text-green-700 bg-white border border-green-300 hover:bg-green-50',
  }

  // This wrapper keeps the modal tethered to the viewer's current spot instead of the global center
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop - gently dims everything behind the dialog */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal container - sticks near the caller with soft top/bottom spacing */}
      <div
        className="relative z-10 w-full max-h-full px-3 sm:px-4 py-6 sm:py-10 flex justify-center"
        style={{ marginTop: `${modalMarginTop}px` }}
      >
        {/* Modal - keeps the familiar card look while respecting tighter positioning */}
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl animate-in fade-in zoom-in duration-200 max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        {/* Header - responsive padding for different screen sizes */}
        <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${styles.border} ${styles.bg}`}>
          <h3 className="text-base sm:text-lg font-bold text-navy-500 pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - scrollable content area with smooth scrolling and responsive padding */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scroll-smooth">
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            {message}
          </p>
          {children && (
            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
              {children}
            </div>
          )}
        </div>

        {/* Footer - responsive padding and button sizing */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-b-lg flex-shrink-0">
          <button
            onClick={onClose}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${cancelBtnByVariant[variant]}`}
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded-lg transition-colors ${styles.button}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

