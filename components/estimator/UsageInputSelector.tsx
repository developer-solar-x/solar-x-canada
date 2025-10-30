'use client'

import { useState } from 'react'
import { Upload, Calendar, Zap, AlertCircle, CheckCircle, X } from 'lucide-react'
import { 
  parseGreenButtonCSV, 
  greenButtonToUsageData, 
  generateHourlyFromMonthly,
  validateUsageData,
  MonthlyUsageEntry,
  GreenButtonEntry
} from '../../lib/usage-parser'
import { RatePlan } from '../../config/rate-plans'
import { UsageDataPoint } from '../../lib/battery-dispatch'

// Props interface for the usage input selector component
interface UsageInputSelectorProps {
  ratePlan: RatePlan
  annualUsageKwh: number
  onUsageDataChange: (data: UsageDataPoint[], source: 'csv' | 'monthly' | 'annual') => void
  onAnnualUsageChange: (kwh: number) => void
}

export function UsageInputSelector({ 
  ratePlan, 
  annualUsageKwh, 
  onUsageDataChange,
  onAnnualUsageChange 
}: UsageInputSelectorProps) {
  // State management for input method selection
  const [inputMethod, setInputMethod] = useState<'annual' | 'monthly' | 'csv'>('annual')
  
  // State for CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvStatus, setCsvStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [csvMessage, setCsvMessage] = useState<string>('')
  
  // State for manual monthly entry
  const [monthlyValues, setMonthlyValues] = useState<number[]>(
    Array(12).fill(Math.round(annualUsageKwh / 12))
  )
  
  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Handle CSV file upload
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setCsvFile(file)
    setCsvStatus('processing')
    setCsvMessage('Processing CSV file...')
    
    try {
      // Read file content
      const text = await file.text()
      
      // Parse Green Button CSV
      const greenButtonData: GreenButtonEntry[] = parseGreenButtonCSV(text)
      
      if (greenButtonData.length === 0) {
        throw new Error('No valid data found in CSV file')
      }
      
      // Convert to usage data points with rates
      const usageData = greenButtonToUsageData(greenButtonData, ratePlan)
      
      // Validate data
      const validation = validateUsageData(usageData)
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }
      
      // Calculate total annual usage from CSV
      const totalKwh = usageData.reduce((sum, point) => sum + point.kwh, 0)
      onAnnualUsageChange(Math.round(totalKwh))
      
      // Pass cleaned data to parent
      onUsageDataChange(validation.cleanedData, 'csv')
      
      setCsvStatus('success')
      setCsvMessage(`✓ Loaded ${greenButtonData.length.toLocaleString()} data points${
        validation.warnings.length > 0 ? ` (${validation.warnings.length} warnings)` : ''
      }`)
      
    } catch (error) {
      setCsvStatus('error')
      setCsvMessage(`Error: ${error instanceof Error ? error.message : 'Failed to process CSV'}`)
      console.error('CSV parsing error:', error)
    }
  }

  // Handle monthly value change
  const handleMonthlyChange = (monthIndex: number, value: string) => {
    const kwh = parseFloat(value) || 0
    const newValues = [...monthlyValues]
    newValues[monthIndex] = kwh
    setMonthlyValues(newValues)
    
    // Update annual total
    const newAnnual = newValues.reduce((sum, val) => sum + val, 0)
    onAnnualUsageChange(Math.round(newAnnual))
  }

  // Apply monthly values
  const applyMonthlyValues = () => {
    const year = new Date().getFullYear()
    
    // Create monthly entries
    const monthlyData: MonthlyUsageEntry[] = monthlyValues.map((kwh, index) => ({
      month: index + 1,
      year,
      totalKwh: kwh
    }))
    
    // Generate hourly data from monthly entries
    const usageData = generateHourlyFromMonthly(monthlyData, ratePlan)
    
    // Pass to parent
    onUsageDataChange(usageData, 'monthly')
  }

  // Auto-distribute annual value across months with seasonal pattern
  const autoDistributeMonthly = () => {
    // Ontario seasonal pattern (percentages)
    const seasonalPattern = [
      11.0, 10.0, 8.5, 7.0, 6.5, 7.5, // Jan-Jun
      9.5, 9.5, 7.5, 7.0, 8.0, 9.5    // Jul-Dec
    ]
    
    const newValues = seasonalPattern.map(percent => 
      Math.round((annualUsageKwh * percent) / 100)
    )
    
    setMonthlyValues(newValues)
  }

  return (
    <div className="space-y-4">
      {/* Input Method Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How would you like to input your usage data?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Annual Input */}
          <button
            onClick={() => setInputMethod('annual')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              inputMethod === 'annual'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-red-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} className={inputMethod === 'annual' ? 'text-red-500' : 'text-gray-600'} />
              <div className="font-semibold text-navy-500">Annual Total</div>
            </div>
            <div className="text-xs text-gray-600">
              Enter total yearly usage (simplest method)
            </div>
          </button>

          {/* Monthly Input */}
          <button
            onClick={() => setInputMethod('monthly')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              inputMethod === 'monthly'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-red-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} className={inputMethod === 'monthly' ? 'text-red-500' : 'text-gray-600'} />
              <div className="font-semibold text-navy-500">Monthly Values</div>
            </div>
            <div className="text-xs text-gray-600">
              Enter 12 monthly values for accuracy
            </div>
          </button>

          {/* CSV Upload */}
          <button
            onClick={() => setInputMethod('csv')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              inputMethod === 'csv'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-red-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Upload size={20} className={inputMethod === 'csv' ? 'text-red-500' : 'text-gray-600'} />
              <div className="font-semibold text-navy-500">Upload CSV</div>
            </div>
            <div className="text-xs text-gray-600">
              Green Button data (most accurate)
            </div>
          </button>
        </div>
      </div>

      {/* Annual Input Section */}
      {inputMethod === 'annual' && (
        <div className="card p-4 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Energy Usage (kWh)
          </label>
          <input
            type="number"
            value={annualUsageKwh}
            onChange={(e) => onAnnualUsageChange(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            min="1000"
            max="50000"
            step="100"
          />
          <p className="text-xs text-gray-500 mt-2">
            Uses seasonal adjustment factors to estimate monthly variation
          </p>
        </div>
      )}

      {/* Monthly Input Section */}
      {inputMethod === 'monthly' && (
        <div className="card p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-navy-500">Monthly Usage (kWh)</h4>
            <button
              onClick={autoDistributeMonthly}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Auto-Fill Seasonal Pattern
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {monthNames.map((month, index) => (
              <div key={month}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {month}
                </label>
                <input
                  type="number"
                  value={monthlyValues[index]}
                  onChange={(e) => handleMonthlyChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="0"
                  step="10"
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t">
            <div className="text-sm">
              <span className="text-gray-600">Annual Total:</span>
              <span className="font-bold text-navy-500 ml-2">
                {monthlyValues.reduce((sum, val) => sum + val, 0).toLocaleString()} kWh
              </span>
            </div>
            <button
              onClick={applyMonthlyValues}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
            >
              Apply Monthly Values
            </button>
          </div>
        </div>
      )}

      {/* CSV Upload Section */}
      {inputMethod === 'csv' && (
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
              onChange={handleCSVUpload}
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
                  onClick={() => {
                    setCsvStatus('idle')
                    setCsvFile(null)
                  }}
                  className="ml-auto"
                >
                  <X size={16} className="text-red-600" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

