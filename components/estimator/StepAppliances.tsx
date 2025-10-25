'use client'

// Step 3: Appliance inventory and energy usage calculation

import { useState } from 'react'
import { Plus, Trash2, Zap, TrendingUp, Info, Calculator, Lightbulb } from 'lucide-react'

interface Appliance {
  id: string
  name: string
  quantity: number
  wattage: number
  hoursPerDay: number
  category: 'essential' | 'comfort' | 'future' | 'custom'
  isCustom?: boolean
}

interface StepAppliancesProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

// Preset common appliances with typical wattage
const PRESET_APPLIANCES: Omit<Appliance, 'id'>[] = [
  // Essential Appliances
  { name: 'Refrigerator', quantity: 1, wattage: 150, hoursPerDay: 24, category: 'essential' },
  { name: 'Freezer', quantity: 0, wattage: 100, hoursPerDay: 24, category: 'essential' },
  { name: 'Water Heater (Electric)', quantity: 1, wattage: 4000, hoursPerDay: 3, category: 'essential' },
  { name: 'Washing Machine', quantity: 1, wattage: 500, hoursPerDay: 1, category: 'essential' },
  { name: 'Dryer (Electric)', quantity: 1, wattage: 3000, hoursPerDay: 1, category: 'essential' },
  { name: 'Dishwasher', quantity: 1, wattage: 1800, hoursPerDay: 1, category: 'essential' },
  { name: 'Microwave', quantity: 1, wattage: 1000, hoursPerDay: 0.5, category: 'essential' },
  { name: 'Oven/Stove (Electric)', quantity: 1, wattage: 2400, hoursPerDay: 1, category: 'essential' },
  
  // Comfort & Entertainment
  { name: 'Air Conditioner (Central)', quantity: 0, wattage: 3500, hoursPerDay: 8, category: 'comfort' },
  { name: 'Space Heater', quantity: 0, wattage: 1500, hoursPerDay: 6, category: 'comfort' },
  { name: 'LED Lights (per bulb)', quantity: 15, wattage: 10, hoursPerDay: 5, category: 'comfort' },
  { name: 'TV (LED)', quantity: 2, wattage: 80, hoursPerDay: 5, category: 'comfort' },
  { name: 'Computer/Laptop', quantity: 2, wattage: 150, hoursPerDay: 8, category: 'comfort' },
  { name: 'Wi-Fi Router', quantity: 1, wattage: 10, hoursPerDay: 24, category: 'comfort' },
  { name: 'Gaming Console', quantity: 0, wattage: 150, hoursPerDay: 3, category: 'comfort' },
  
  // Future Planning
  { name: 'Electric Vehicle Charger (Level 2)', quantity: 0, wattage: 7200, hoursPerDay: 4, category: 'future' },
  { name: 'Hot Tub/Spa', quantity: 0, wattage: 1500, hoursPerDay: 2, category: 'future' },
  { name: 'Pool Pump', quantity: 0, wattage: 1000, hoursPerDay: 8, category: 'future' },
  { name: 'Home Office Equipment', quantity: 0, wattage: 300, hoursPerDay: 8, category: 'future' },
]

export function StepAppliances({ data, onComplete, onBack }: StepAppliancesProps) {
  // Initialize appliances from saved data or presets
  const [appliances, setAppliances] = useState<Appliance[]>(() => {
    // Always start with presets
    const presetsWithIds = PRESET_APPLIANCES.map((preset, index) => ({
      ...preset,
      id: `preset-${index}`,
    }))
    
    // If we have saved data, merge it
    if (data.appliances && data.appliances.length > 0) {
      // Create a map of saved appliances by name (for presets) or id (for custom)
      const savedMap = new Map(
        data.appliances.map(app => [app.name || app.id, app])
      )
      
      // Update presets with saved values, and add custom appliances
      const mergedPresets = presetsWithIds.map(preset => {
        const saved = savedMap.get(preset.name)
        savedMap.delete(preset.name) // Remove from map after processing
        return saved ? { ...preset, ...saved, id: preset.id } : preset
      })
      
      // Add any remaining custom appliances
      const customAppliances = Array.from(savedMap.values()).filter(app => app.isCustom)
      
      return [...mergedPresets, ...customAppliances]
    }
    
    return presetsWithIds
  })

  const [showCustomForm, setShowCustomForm] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'essential' | 'comfort' | 'future' | 'custom'>('custom')
  const [customAppliance, setCustomAppliance] = useState({
    name: '',
    quantity: 1,
    wattage: 0,
    hoursPerDay: 0,
  })

  // Calculate daily kWh for a single appliance
  const calculateDailyKwh = (appliance: Appliance) => {
    const wattage = Number(appliance.wattage) || 0
    const hours = Number(appliance.hoursPerDay) || 0
    const qty = Number(appliance.quantity) || 0
    return (wattage * hours * qty) / 1000
  }

  // Calculate total daily kWh
  const totalDailyKwh = appliances.reduce((sum, app) => {
    const kwh = calculateDailyKwh(app)
    return sum + (isNaN(kwh) ? 0 : kwh)
  }, 0)
  
  // Calculate monthly and annual kWh with safety checks
  const totalMonthlyKwh = Math.round(isNaN(totalDailyKwh) ? 0 : totalDailyKwh * 30)
  const totalAnnualKwh = Math.round(isNaN(totalDailyKwh) ? 0 : totalDailyKwh * 365)

  // Update appliance quantity
  const updateAppliance = (id: string, field: keyof Appliance, value: any) => {
    setAppliances(appliances.map(app => 
      app.id === id ? { ...app, [field]: value } : app
    ))
  }

  // Add custom appliance (can now be added to any category)
  const addCustomAppliance = () => {
    if (customAppliance.name.trim() && customAppliance.wattage > 0) {
      setAppliances([
        ...appliances,
        {
          ...customAppliance,
          id: `custom-${Date.now()}`,
          category: activeCategory,
          isCustom: true,
        }
      ])
      setCustomAppliance({ name: '', quantity: 1, wattage: 0, hoursPerDay: 0 })
      setShowCustomForm(false)
      setActiveCategory('custom')
    }
  }
  
  // Open add form for specific category
  const openAddForm = (category: 'essential' | 'comfort' | 'future' | 'custom') => {
    setActiveCategory(category)
    setShowCustomForm(true)
  }
  
  // Cancel add form
  const cancelAddForm = () => {
    setShowCustomForm(false)
    setActiveCategory('custom')
    setCustomAppliance({ name: '', quantity: 1, wattage: 0, hoursPerDay: 0 })
  }

  // Remove appliance
  const removeAppliance = (id: string) => {
    setAppliances(appliances.filter(app => app.id !== id))
  }

  // Handle continue
  const handleContinue = () => {
    // Save ALL appliances (including quantity 0) to preserve state when navigating back
    onComplete({
      appliances: appliances,
      energyUsage: {
        dailyKwh: Math.round(totalDailyKwh),
        monthlyKwh: totalMonthlyKwh,
        annualKwh: totalAnnualKwh,
      }
    })
  }

  // Group appliances by category
  const essentialAppliances = appliances.filter(app => app.category === 'essential')
  const comfortAppliances = appliances.filter(app => app.category === 'comfort')
  const futureAppliances = appliances.filter(app => app.category === 'future')
  const customAppliances = appliances.filter(app => app.category === 'custom')

  // Render appliance row
  const renderApplianceRow = (appliance: Appliance) => {
    const dailyKwh = calculateDailyKwh(appliance)
    
    return (
      <tr key={appliance.id} className={`border-b border-gray-100 group hover:bg-gray-50 ${appliance.quantity === 0 ? 'opacity-50' : ''}`}>
        <td className="py-3 px-2">
          <div className="font-medium text-gray-800 text-sm">{appliance.name}</div>
        </td>
        <td className="py-3 px-2">
          <input
            type="number"
            min="0"
            max="99"
            value={appliance.quantity}
            onChange={(e) => updateAppliance(appliance.id, 'quantity', parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </td>
        <td className="py-3 px-2">
          <input
            type="number"
            min="0"
            value={appliance.wattage}
            onChange={(e) => updateAppliance(appliance.id, 'wattage', parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </td>
        <td className="py-3 px-2">
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={appliance.hoursPerDay}
            onChange={(e) => updateAppliance(appliance.id, 'hoursPerDay', parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </td>
        <td className="py-3 px-2 text-right">
          <span className="font-semibold text-navy-500 text-sm">
            {dailyKwh.toFixed(2)} kWh
          </span>
        </td>
                <td className="py-3 px-2 text-right">
          <button
            onClick={() => removeAppliance(appliance.id)}
            className="text-red-500 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove appliance"
            title="Delete this appliance"
          >
            <Trash2 size={16} />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content - Appliance tables */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-navy-500 mb-2">
              Energy Usage Calculator
            </h2>
            <p className="text-gray-600">
              Adjust quantities and usage to match your household's energy consumption
            </p>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Why this matters</p>
              <p>Accurate appliance data helps us design a solar system that meets your actual energy needs, not just averages.</p>
            </div>
          </div>

          {/* Essential Appliances */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <Zap size={20} />
                  Essential Appliances
                </h3>
                <p className="text-sm opacity-90 mt-0.5">Major energy consumers in your home</p>
              </div>
              <button
                onClick={() => openAddForm('essential')}
                className="bg-white text-red-500 px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Appliance</th>
                    <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Qty</th>
                    <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Watts</th>
                    <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Hours/Day</th>
                    <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Daily kWh</th>
                    <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {essentialAppliances.map(renderApplianceRow)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comfort & Entertainment */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <Lightbulb size={20} />
                  Comfort & Entertainment
                </h3>
                <p className="text-sm opacity-90 mt-0.5">Lifestyle and comfort appliances</p>
              </div>
              <button
                onClick={() => openAddForm('comfort')}
                className="bg-white text-blue-500 px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Appliance</th>
                    <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Qty</th>
                    <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Watts</th>
                    <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Hours/Day</th>
                    <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Daily kWh</th>
                    <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {comfortAppliances.map(renderApplianceRow)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Future Planning */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <TrendingUp size={20} />
                  Future Planning
                </h3>
                <p className="text-sm opacity-90 mt-0.5">Plan for upcoming purchases (EVs, pool, etc.)</p>
              </div>
              <button
                onClick={() => openAddForm('future')}
                className="bg-white text-teal-500 px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-teal-50 transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Appliance</th>
                    <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Qty</th>
                    <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Watts</th>
                    <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Hours/Day</th>
                    <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Daily kWh</th>
                    <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {futureAppliances.map(renderApplianceRow)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Appliances */}
          {customAppliances.length > 0 && (
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Plus size={20} />
                  Custom Appliances
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Appliance</th>
                      <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Qty</th>
                      <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Watts</th>
                      <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Hours/Day</th>
                      <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Daily kWh</th>
                      <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {customAppliances.map(renderApplianceRow)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add custom appliance form */}
          {!showCustomForm ? (
            <button
              onClick={() => openAddForm('custom')}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-500 transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Plus size={20} />
              Add Custom Appliance
            </button>
          ) : (
            <div className="card p-4 border-2 border-red-500">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">
                  Add to: <span className="text-red-500 capitalize">{activeCategory === 'custom' ? 'Custom Appliances' : `${activeCategory} Appliances`}</span>
                </h4>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  activeCategory === 'essential' ? 'bg-red-100 text-red-600' : 
                  activeCategory === 'comfort' ? 'bg-blue-100 text-blue-600' : 
                  activeCategory === 'future' ? 'bg-teal-100 text-teal-600' : 
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activeCategory === 'essential' ? 'Essential' : activeCategory === 'comfort' ? 'Comfort' : activeCategory === 'future' ? 'Future' : 'Custom'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Appliance name"
                  value={customAppliance.name}
                  onChange={(e) => setCustomAppliance({ ...customAppliance, name: e.target.value })}
                  className="col-span-2 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  min="1"
                  value={customAppliance.quantity}
                  onChange={(e) => setCustomAppliance({ ...customAppliance, quantity: parseInt(e.target.value) || 1 })}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Watts"
                  min="0"
                  value={customAppliance.wattage || ''}
                  onChange={(e) => setCustomAppliance({ ...customAppliance, wattage: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Hours/day"
                  min="0"
                  max="24"
                  step="0.5"
                  value={customAppliance.hoursPerDay || ''}
                  onChange={(e) => setCustomAppliance({ ...customAppliance, hoursPerDay: parseFloat(e.target.value) || 0 })}
                  className="col-span-2 md:col-span-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={addCustomAppliance}
                  className="btn-primary flex-1"
                  disabled={!customAppliance.name.trim() || customAppliance.wattage === 0}
                >
                  Add Appliance
                </button>
                <button
                  onClick={cancelAddForm}
                  className="btn-outline border-gray-300 text-gray-700 flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Summary */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="text-red-500" size={24} />
              <h3 className="font-bold text-navy-500">Energy Summary</h3>
            </div>

            <div className="space-y-4">
              {/* Daily usage */}
              <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-lg border border-red-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Daily Usage</div>
                <div className="text-3xl font-bold text-red-500">
                  {totalDailyKwh.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 mt-1">kWh per day</div>
              </div>

              {/* Monthly usage */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Monthly Usage</div>
                <div className="text-2xl font-bold text-blue-500">
                  {totalMonthlyKwh.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">kWh per month</div>
              </div>

              {/* Annual usage */}
              <div className="bg-gradient-to-br from-teal-50 to-white p-4 rounded-lg border border-teal-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Annual Usage</div>
                <div className="text-2xl font-bold text-teal-500">
                  {totalAnnualKwh.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">kWh per year</div>
              </div>

              {/* Active appliances count */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Active Appliances</div>
                <div className="text-lg font-bold text-navy-500">
                  {appliances.filter(app => app.quantity > 0).length} items
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 mt-6">
              <button
                onClick={handleContinue}
                className="btn-primary w-full"
              >
                Continue to System Design
              </button>
              
              {onBack && (
                <button
                  onClick={onBack}
                  className="btn-outline border-gray-300 text-gray-700 w-full"
                >
                  Back
                </button>
              )}
            </div>

            {/* Tip */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-800">
                <strong className="text-navy-500">Pro Tip:</strong> Set future appliances (like EVs) to quantity 1 to ensure your solar system can handle growth.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

