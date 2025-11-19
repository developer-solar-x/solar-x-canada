'use client'

// Reusable skeleton loader components for admin sections

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="animate-pulse">
        {/* Table header */}
        <div className="bg-navy-500 h-12 mb-0"></div>
        
        {/* Table rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-200 rounded flex-1"
                  style={{ maxWidth: j === 0 ? '100px' : j === 1 ? '200px' : '150px' }}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonStatsGrid() {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-40"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-5 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-28"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-6 mx-auto"></div>
      </td>
    </tr>
  )
}

export function SkeletonUserTableRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-40"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </td>
    </tr>
  )
}

export function SkeletonChart() {
  return (
    <div className="card p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="flex-1 bg-gray-200 rounded h-4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


