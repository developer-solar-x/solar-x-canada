'use client'

// Commercial Step: Green Button Upload (Optional)

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowRight, Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react'
import { parseGreenButton, type ParsedGreenButton } from '@/lib/green-button-parser'

interface StepCommercialGreenButtonProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
  onSkip?: () => void
}

export function StepCommercialGreenButton({ data, onComplete, onBack, onSkip }: StepCommercialGreenButtonProps) {
  const [parsedData, setParsedData] = useState<ParsedGreenButton | null>(
    data.greenButtonData || null
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsProcessing(true)
    setError(null)

    try {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit')
      }

      const parsed = await parseGreenButton(file)
      setParsedData(parsed)

      // Auto-fill inputs based on parsed data
      const updates: any = {
        measuredPeakKVA: parsed.peak15minKW / (data.currentPF || 0.9),
        peakDurationMin: parsed.typicalPeakDurationMin,
        greenButtonData: parsed,
        intervalKW: parsed.intervals,
      }

      // Suggest target cap if not set
      if (!data.targetCapKW) {
        const kW1 = parsed.peak15minKW
        updates.targetCapKW = Math.max(0, kW1 - 50) // Suggest shaving 50 kW
      }

      onComplete(updates)
    } catch (err: any) {
      setError(err.message || 'Failed to parse file')
      setIsProcessing(false)
    }
  }, [data, onComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/xml': ['.xml'],
      'application/xml': ['.xml'],
    },
    maxFiles: 1,
  })

  const handleContinue = () => {
    if (parsedData) {
      onComplete({
        greenButtonData: parsedData,
        intervalKW: parsedData.intervals,
      })
    } else {
      // Skip without data
      onComplete({})
    }
  }

  const handleSkip = () => {
    onComplete({})
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          Upload Green Button File
        </h1>
        <p className="text-gray-600">
          Upload your utility data to auto-detect peak demand and duration
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="card p-8 mb-6 border-2 border-dashed border-yellow-300 bg-yellow-50">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚧</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Coming Soon</h2>
            <p className="text-yellow-700">
              Green Button file upload is currently under development. You can continue with manual inputs in the next steps.
            </p>
          </div>
        </div>
      </div>

      <div className="card space-y-6">
        {/* Upload Area - Disabled */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center opacity-60 cursor-not-allowed bg-gray-50"
        >
          <Upload className="mx-auto text-gray-400" size={48} />
          <div className="mt-4">
            <p className="text-lg font-semibold text-gray-500">
              Green Button Upload
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Coming soon - manual inputs available in next steps
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Parsed Data Summary */}
        {parsedData && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-green-800 mb-2">
                  File parsed successfully!
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <div>Peak 15-min kW: <strong>{parsedData.peak15minKW.toFixed(1)} kW</strong></div>
                  <div>Peak Date/Time: <strong>{new Date(parsedData.peakDateTime).toLocaleString()}</strong></div>
                  <div>Base Load: <strong>{parsedData.baseLoadKW.toFixed(1)} kW</strong></div>
                  <div>Typical Peak Duration: <strong>{parsedData.typicalPeakDurationMin} minutes</strong></div>
                  <div>Total Intervals: <strong>{parsedData.intervals.length}</strong></div>
                </div>
              </div>
              <button
                onClick={() => {
                  setParsedData(null)
                  setError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {parsedData.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-yellow-800 mb-2">Warnings:</div>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  {parsedData.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <strong>Green Button Format:</strong> Upload your utility interval data in CSV or XML format.
            The system will automatically detect your peak demand, base load, and typical peak duration.
            This will pre-fill the tariff and peak shaving inputs.
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            className="btn-primary flex items-center gap-2"
          >
            Continue to Tariff
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

