'use client'

import { ArrowRight } from 'lucide-react'
import type { ProgramCardProps } from '../types'

export function ProgramCard({
  icon,
  title,
  description,
  badge,
  badgeColor = 'bg-gray-100 text-gray-600',
  features,
  buttonText,
  buttonClassName = 'btn-primary',
  onClick,
  disabled = false,
  comingSoon = false,
  additionalInfo,
}: ProgramCardProps) {
  const cardClassName = disabled || comingSoon
    ? 'card p-8 opacity-60 border-2 border-dashed border-gray-300 cursor-not-allowed'
    : 'card p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-red-500 group'

  const buttonDisabledClassName = disabled || comingSoon
    ? 'bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg w-full cursor-not-allowed'
    : `${buttonClassName} w-full group-hover:shadow-lg flex items-center justify-center gap-2`

  return (
    <div onClick={disabled || comingSoon ? undefined : onClick} className={cardClassName}>
      <div className="flex items-center justify-between mb-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${disabled || comingSoon ? '' : 'group-hover:scale-110 transition-transform'}`}>
          {icon}
        </div>
        {badge && (
          <span className={`px-3 py-1 ${badgeColor} text-xs font-bold rounded-full`}>
            {badge}
          </span>
        )}
      </div>

      <h2 className="text-2xl font-bold text-navy-500 mb-1">
        {title}
      </h2>
      {additionalInfo && (
        <p className="text-sm text-gray-600 mb-1 font-semibold">{additionalInfo}</p>
      )}
      <p className="text-gray-600 mb-6">
        {description}
      </p>

      <div className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              disabled || comingSoon ? 'bg-gray-200' : 'bg-green-100'
            }`}>
              <svg className={`w-4 h-4 ${disabled || comingSoon ? 'text-gray-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className={`text-sm ${disabled || comingSoon ? 'text-gray-500' : 'text-gray-700'}`}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      <button
        className={buttonDisabledClassName}
        disabled={disabled || comingSoon}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled && !comingSoon) onClick()
        }}
      >
        {buttonText}
        {!disabled && !comingSoon && <ArrowRight size={20} />}
      </button>

      {!disabled && !comingSoon && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          {title === 'Quick Estimate' ? 'You can upgrade to detailed later' : "We'll confirm eligibility during review"}
        </p>
      )}
    </div>
  )
}

