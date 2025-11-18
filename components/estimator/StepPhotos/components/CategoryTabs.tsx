'use client'

import type { CategoryTabsProps } from '../types'

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  getPhotosForCategory,
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
      {categories.map(category => {
        const categoryPhotos = getPhotosForCategory(category.id)
        const isComplete = category.required ? categoryPhotos.length > 0 : true
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategory === category.id
                ? 'bg-red-500 text-white'
                : isComplete
                ? 'bg-green-50 text-green-600 border border-green-200'
                : category.required
                ? 'bg-gray-100 text-gray-600 border border-gray-200'
                : 'bg-gray-50 text-gray-500'
            }`}
          >
            {category.name}
            {categoryPhotos.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                activeCategory === category.id ? 'bg-white/20' : 'bg-white'
              }`}>
                {categoryPhotos.length}
              </span>
            )}
            {category.required && categoryPhotos.length === 0 && (
              <span className="text-red-500">*</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

