'use client'

// Step 3: Appliance inventory and energy usage calculation

import { useState } from 'react'
import { Plus, Zap, Lightbulb, TrendingUp, Info } from 'lucide-react'
import { ApplianceTable } from './components/ApplianceTable'
import { CustomApplianceForm } from './components/CustomApplianceForm'
import { EnergySummary } from './sections/EnergySummary'
import { PRESET_APPLIANCES } from './constants'
import type { StepAppliancesProps, Appliance, ApplianceCategory } from './types'

export function StepAppliances({ data, onComplete, onBack }: StepAppliancesProps) {
  // Initialize appliances from saved data or presets
  const [appliances, setAppliances] = useState<Appliance[]>(() => {
    // Always start with presets
    const presetsWithIds: Appliance[] = PRESET_APPLIANCES.map((preset, index) => ({
      ...preset,
      id: `preset-${index}`,
    }))
    
    // If we have saved data, merge it
    if (data.appliances && data.appliances.length > 0) {
      // Create a map of saved appliances by name (for presets) or id (for custom)
      const savedMap = new Map<string, Appliance>(
        data.appliances.map((app: Appliance) => [app.name || app.id, app])
      )
      
      // Update presets with saved values, and add custom appliances
      const mergedPresets: Appliance[] = presetsWithIds.map(preset => {
        const saved = savedMap.get(preset.name)
        savedMap.delete(preset.name) // Remove from map after processing
        return saved ? { ...preset, ...saved, id: preset.id } : preset
      })
      
      // Add any remaining custom appliances
      const customAppliances: Appliance[] = Array.from(savedMap.values()).filter(app => app.isCustom)
      
      return [...mergedPresets, ...customAppliances]
    }
    
    return presetsWithIds
  })

  const [showCustomForm, setShowCustomForm] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ApplianceCategory>('custom')
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
  const openAddForm = (category: ApplianceCategory) => {
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
          <ApplianceTable
            appliances={appliances}
            category="essential"
            title="Essential Appliances"
            description="Major energy consumers in your home"
            icon={<Zap size={20} />}
            headerColor="from-red-500 to-red-600"
            buttonColor="text-red-500"
            onUpdateAppliance={updateAppliance}
            onRemoveAppliance={removeAppliance}
            onAddClick={() => openAddForm('essential')}
          />

          {/* Comfort & Entertainment */}
          <ApplianceTable
            appliances={appliances}
            category="comfort"
            title="Comfort & Entertainment"
            description="Lifestyle and comfort appliances"
            icon={<Lightbulb size={20} />}
            headerColor="from-blue-500 to-blue-600"
            buttonColor="text-blue-500"
            onUpdateAppliance={updateAppliance}
            onRemoveAppliance={removeAppliance}
            onAddClick={() => openAddForm('comfort')}
          />

          {/* Future Planning */}
          <ApplianceTable
            appliances={appliances}
            category="future"
            title="Future Planning"
            description="Plan for upcoming purchases (EVs, pool, etc.)"
            icon={<TrendingUp size={20} />}
            headerColor="from-teal-500 to-teal-600"
            buttonColor="text-teal-500"
            onUpdateAppliance={updateAppliance}
            onRemoveAppliance={removeAppliance}
            onAddClick={() => openAddForm('future')}
          />

          {/* Custom Appliances */}
          {customAppliances.length > 0 && (
            <ApplianceTable
              appliances={appliances}
              category="custom"
              title="Custom Appliances"
              description=""
              icon={<Plus size={20} />}
              headerColor="from-gray-600 to-gray-700"
              buttonColor="text-gray-600"
              onUpdateAppliance={updateAppliance}
              onRemoveAppliance={removeAppliance}
              onAddClick={() => openAddForm('custom')}
            />
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
            <CustomApplianceForm
              customAppliance={customAppliance}
              activeCategory={activeCategory}
              onCustomApplianceChange={(field, value) => setCustomAppliance({ ...customAppliance, [field]: value })}
              onAdd={addCustomAppliance}
              onCancel={cancelAddForm}
            />
          )}
        </div>

        {/* Right sidebar - Summary */}
        <EnergySummary
          totalDailyKwh={totalDailyKwh}
          totalMonthlyKwh={totalMonthlyKwh}
          totalAnnualKwh={totalAnnualKwh}
          activeApplianceCount={appliances.filter(app => app.quantity > 0).length}
          onContinue={handleContinue}
          onBack={onBack}
        />
      </div>
    </div>
  )
}

