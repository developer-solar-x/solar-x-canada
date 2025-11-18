'use client'

import { ArrowRight } from 'lucide-react'
import type { LeadTypeCardProps } from '../types'

export function LeadTypeCard({
  icon,
  title,
  description,
  features,
  buttonText,
  onClick,
  disabled = false,
  badge,
  badgeColor = 'bg-gray-100 text-gray-600',
}: LeadTypeCardProps) {
  const cardClassName = disabled
    ? 'card p-8 opacity-60 border-2 border-dashed border-gray-300 cursor-not-allowed'
    : 'card p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-navy-500 group text-left'

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cardClassName}
    >
      <div className="flex items-center justify-between mb-6">
        {icon}
        {badge && (
          <span className={`px-3 py-1 ${badgeColor} text-xs font-bold rounded-full`}>
            {badge}
          </span>
        )}
      </div>

      <h3 className={`text-2xl font-bold mb-3 ${disabled ? 'text-gray-500' : 'text-navy-500'}`}>
        {title}
      </h3>
      
      <p className={`mb-6 ${disabled ? 'text-gray-500' : 'text-gray-600'}`}>
        {description}
      </p>

      <div className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              disabled ? 'bg-gray-200' : 'bg-green-100'
            }`}>
              <svg className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className={`text-sm ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      <button
        className={disabled
          ? 'bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg w-full cursor-not-allowed'
          : 'bg-navy-500 hover:bg-navy-600 text-white font-semibold py-3 px-6 rounded-lg transition-all w-full group-hover:shadow-lg flex items-center justify-center gap-2'
        }
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) onClick()
        }}
      >
        {buttonText}
        {!disabled && <ArrowRight size={20} />}
      </button>
    </div>
  )
}

