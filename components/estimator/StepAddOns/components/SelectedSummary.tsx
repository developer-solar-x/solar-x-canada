import { Check } from 'lucide-react'

interface SelectedSummaryProps {
  count: number
}

export function SelectedSummary({ count }: SelectedSummaryProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2">
        <Check size={20} className="text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {count} add-on{count !== 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-gray-600">
            We'll include these in your custom quote
          </p>
        </div>
      </div>
    </div>
  )
}

