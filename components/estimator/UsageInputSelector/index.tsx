'use client'

import { useState } from 'react'
import { 
  parseGreenButtonCSV, 
  greenButtonToUsageData, 
  generateHourlyFromMonthly,
  validateUsageData,
  MonthlyUsageEntry,
} from '../../../lib/usage-parser'
import { MethodSelector } from './components/MethodSelector'
import { AnnualInput } from './components/AnnualInput'
import { MonthlyInput } from './components/MonthlyInput'
import { CSVUpload } from './components/CSVUpload'
import { SEASONAL_PATTERN } from './constants'
import type { UsageInputSelectorProps, InputMethod } from './types'

export function UsageInputSelector({ 
  ratePlan, 
  annualUsageKwh, 
  onUsageDataChange,
  onAnnualUsageChange 
}: UsageInputSelectorProps) {
  // State management for input method selection
  const [inputMethod, setInputMethod] = useState<InputMethod>('annual')
  
  // State for CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvStatus, setCsvStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [csvMessage, setCsvMessage] = useState<string>('')
  
  // State for manual monthly entry
  const [monthlyValues, setMonthlyValues] = useState<number[]>(
    Array(12).fill(Math.round(annualUsageKwh / 12))
  )

  // Handle CSV file upload
  const handleCSVUpload = async (file: File) => {
    setCsvFile(file)
    setCsvStatus('processing')
    setCsvMessage('Processing CSV file...')
    
    try {
      // Read file content
      const text = await file.text()
      
      // Parse Green Button CSV
      const greenButtonData = parseGreenButtonCSV(text)
      
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
    const newValues = SEASONAL_PATTERN.map(percent => 
      Math.round((annualUsageKwh * percent) / 100)
    )
    
    setMonthlyValues(newValues)
  }

  const handleClearError = () => {
    setCsvStatus('idle')
    setCsvFile(null)
  }

  return (
    <div className="space-y-4">
      {/* Input Method Selector */}
      <MethodSelector
        inputMethod={inputMethod}
        onMethodChange={setInputMethod}
      />

      {/* Annual Input Section */}
      {inputMethod === 'annual' && (
        <AnnualInput
          annualUsageKwh={annualUsageKwh}
          onAnnualUsageChange={onAnnualUsageChange}
        />
      )}

      {/* Monthly Input Section */}
      {inputMethod === 'monthly' && (
        <MonthlyInput
          monthlyValues={monthlyValues}
          onMonthlyChange={handleMonthlyChange}
          onAutoDistribute={autoDistributeMonthly}
          onApply={applyMonthlyValues}
        />
      )}

      {/* CSV Upload Section */}
      {inputMethod === 'csv' && (
        <CSVUpload
          onFileUpload={handleCSVUpload}
          csvFile={csvFile}
          csvStatus={csvStatus}
          csvMessage={csvMessage}
          onClearError={handleClearError}
        />
      )}
    </div>
  )
}

