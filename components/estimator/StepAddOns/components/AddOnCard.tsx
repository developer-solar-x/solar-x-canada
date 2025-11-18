import { Check } from 'lucide-react'
import type { AddOnCardProps } from '../types'

export function AddOnCard({ addOn, isSelected, onToggle }: AddOnCardProps) {
  const Icon = addOn.icon

  return (
    <button
      onClick={onToggle}
      className={`relative p-6 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? 'border-red-500 bg-red-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1">
          <Check size={16} />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${
          isSelected ? 'bg-red-500' : 'bg-gray-100'
        }`}>
          <Icon 
            size={32} 
            className={isSelected ? 'text-white' : 'text-gray-600'} 
          />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-navy-500 mb-1">
            {addOn.name}
          </h3>
          <p className={`text-sm ${isSelected ? 'text-red-700' : 'text-gray-600'}`}>
            {addOn.description}
          </p>
        </div>
      </div>
    </button>
  )
}

