'use client'

import { MapPin, Loader2 } from 'lucide-react'
import type { UseLocationButtonProps } from '../types'

export function UseLocationButton({ onClick, loading, disabled }: UseLocationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="btn-outline border-blue-500 text-blue-500 w-full h-12 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          Getting your location...
        </>
      ) : (
        <>
          <MapPin size={20} />
          Use My Location
        </>
      )}
    </button>
  )
}

