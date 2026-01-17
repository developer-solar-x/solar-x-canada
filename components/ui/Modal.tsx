'use client'

// Reusable modal component

import { X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string | React.ReactNode
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
  // Keep a handle on the scrollable wrapper so we can reset its scroll when reopening
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Track if we're mounted on the client (for portal rendering)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key and manage scroll lock
  useEffect(() => {
    // Whenever the modal closes we instantly reset the margin so the next open starts in view
    if (!isOpen) {
      setModalMarginTop(72) // Default cushion keeps the header visible without forcing extra scrolling
      return
    }

    // Light listener so the Escape key can close the modal without hunting for the button
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape) // Attach the keyboard shortcut once we open the dialog
    scrollPositionRef.current = window.scrollY // Capture the visitor's current scroll position for later restoration

    // Keep the modal within the viewport while nudging it near the trigger point
    setModalMarginTop(72) // Give the dialog a gentle top cushion so it appears immediately without extra scrolling

    // Reset the scroll container so each modal opens from the top instead of remembering the last position
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }

    // Lock background scroll - simpler approach that doesn't shift content
    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // Hide scrollbars to prevent background scrolling

    return () => {
      document.removeEventListener('keydown', handleEscape) // Remove the keyboard listener once the dialog closes
      document.body.style.overflow = previousBodyOverflow // Restore the previous overflow state
      // No need to restore scroll position since we're not manipulating it
    }
  }, [isOpen, onClose]) // Depend on visibility and the provided close handler so behaviour stays in sync

  if (!isOpen || !mounted) return null

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
    info: 'text-navy-600 bg-white border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400',
    warning: 'text-yellow-700 bg-white border-2 border-yellow-300 hover:bg-yellow-50 hover:border-yellow-400',
    danger: 'text-navy-600 bg-white border-2 border-red-300 hover:bg-red-50 hover:border-red-400',
    success: 'text-green-700 bg-white border-2 border-green-300 hover:bg-green-50 hover:border-green-400',
  }

  // This wrapper keeps the modal tethered to the viewer's current spot instead of the global center
  // Use portal to render at document body level, escaping any parent container constraints
  const modalContent = (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
    >
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
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        {/* Header - responsive padding for different screen sizes */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${styles.border} ${styles.bg}`}>
          <h3 className="text-lg sm:text-xl font-bold text-navy-500 pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1 hover:bg-gray-100 rounded"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - scrollable content area with smooth scrolling and responsive padding */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scroll-smooth">
          {typeof message === 'string' ? (
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
              {message}
            </p>
          ) : (
            <div className="text-gray-700 leading-relaxed text-sm sm:text-base">
              {message}
            </div>
          )}
          {children && (
            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
              {children}
            </div>
          )}
        </div>

        {/* Footer - responsive padding and button sizing */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 bg-gray-50 rounded-b-lg flex-shrink-0 border-t border-gray-200">
          <button
            onClick={onClose}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg transition-all hover:shadow-sm ${cancelBtnByVariant[variant]}`}
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white rounded-lg transition-all hover:shadow-md ${styles.button}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  )

  // Render modal via portal to document.body to escape parent container constraints
  // This ensures modals display properly even when parent containers have transform/overflow constraints
  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}

