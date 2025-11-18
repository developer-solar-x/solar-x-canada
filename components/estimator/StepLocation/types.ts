export interface StepLocationProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export interface EmailInputProps {
  email: string
  onEmailChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export interface AddressInputProps {
  address: string
  onAddressChange: (value: string) => void
  suggestions: any[]
  showSuggestions: boolean
  loadingSuggestions: boolean
  onSelectSuggestion: (suggestion: any) => void
  onFocus?: () => void
  disabled?: boolean
  autocompleteRef: React.RefObject<HTMLDivElement>
}

export interface CoordinatesInputProps {
  lat: string
  lng: string
  onLatChange: (value: string) => void
  onLngChange: (value: string) => void
  disabled?: boolean
}

export interface ServiceAreaWarningProps {
  warning: string
  onDismiss: () => void
}

export interface UseLocationButtonProps {
  onClick: () => void
  loading: boolean
  disabled?: boolean
}

export interface LocationData {
  address?: string
  coordinates: { lat: number; lng: number }
  city?: string
  province?: string
  email?: string
}

