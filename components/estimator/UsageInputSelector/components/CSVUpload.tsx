'use client'

import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react'
import type { CSVUploadProps } from '../types'

export function CSVUpload({
  onFileUpload,
  csvFile,
  csvStatus,
  csvMessage,
  onClearError,
}: CSVUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  return (
    <div className="card p-4 bg-gray-50">
      <h4 className="font-semibold text-navy-500 mb-3">Upload Green Button CSV</h4>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 mb-2">
          <strong>Green Button Data:</strong> Download your hourly electricity usage from your utility provider
        </p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Expected format: Timestamp, kWh, Interval (minutes)</li>
          <li>• Supports 15-minute or hourly intervals</li>
          <li>• Minimum 30 days of data recommended</li>
        </ul>
      </div>
      
      <div className="relative">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <Upload size={20} className="text-gray-600" />
          <span className="font-medium text-gray-700">
            {csvFile ? csvFile.name : 'Click to select CSV file'}
          </span>
        </label>
      </div>
      
      {/* CSV Status Messages */}
      {csvStatus !== 'idle' && (
        <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
          csvStatus === 'success' ? 'bg-green-50 border border-green-200' :
          csvStatus === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {csvStatus === 'success' && <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />}
          {csvStatus === 'error' && <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />}
          {csvStatus === 'processing' && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 flex-shrink-0 mt-0.5"></div>
          )}
          <p className={`text-sm ${
            csvStatus === 'success' ? 'text-green-800' :
            csvStatus === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {csvMessage}
          </p>
          {csvStatus === 'error' && (
            <button
              onClick={onClearError}
              className="ml-auto"
            >
              <X size={16} className="text-red-600" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

