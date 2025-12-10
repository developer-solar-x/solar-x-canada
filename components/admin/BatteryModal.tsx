'use client'

// Battery management modal component (Add/Edit)

import { useState, useEffect } from 'react'
import { X, Battery, BatteryCharging, DollarSign, Zap, AlertCircle } from 'lucide-react'
import type { BatterySpec } from '@/config/battery-specs'

interface BatteryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (batteryData: BatteryFormData) => Promise<void>
  battery?: BatterySpec // Existing battery data for edit mode
  mode: 'add' | 'edit'
}

export interface BatteryFormData {
  battery_id: string
  brand: string
  model: string
  nominalKwh: number
  usableKwh: number
  usablePercent: number
  roundTripEfficiency: number
  inverterKw: number
  price: number
  warranty: {
    years: number
    cycles: number
  }
  description?: string
  isActive: boolean
  displayOrder: number
}

export function BatteryModal({ isOpen, onClose, onSave, battery, mode }: BatteryModalProps) {
  const [formData, setFormData] = useState<BatteryFormData>({
    battery_id: '',
    brand: '',
    model: '',
    nominalKwh: 0,
    usableKwh: 0,
    usablePercent: 90,
    roundTripEfficiency: 0.90,
    inverterKw: 5.0,
    price: 0,
    warranty: {
      years: 10,
      cycles: 6000,
    },
    description: '',
    isActive: true,
    displayOrder: 0,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && battery) {
      setFormData({
        battery_id: battery.id,
        brand: battery.brand,
        model: battery.model,
        nominalKwh: battery.nominalKwh,
        usableKwh: battery.usableKwh,
        usablePercent: battery.usablePercent,
        roundTripEfficiency: battery.roundTripEfficiency,
        inverterKw: battery.inverterKw,
        price: battery.price,
        warranty: battery.warranty,
        description: battery.description || '',
        isActive: (battery as any).isActive !== false,
        displayOrder: (battery as any).displayOrder || 0,
      })
    } else {
      // Reset form for add mode
      setFormData({
        battery_id: '',
        brand: '',
        model: '',
        nominalKwh: 0,
        usableKwh: 0,
        usablePercent: 90,
        roundTripEfficiency: 0.90,
        inverterKw: 5.0,
        price: 0,
        warranty: {
          years: 10,
          cycles: 6000,
        },
        description: '',
        isActive: true,
        displayOrder: 0,
      })
    }
    setError('')
  }, [isOpen, battery, mode])

  // Auto-calculate usableKwh when nominalKwh or usablePercent changes
  useEffect(() => {
    if (formData.nominalKwh > 0 && formData.usablePercent > 0) {
      const calculatedUsable = (formData.nominalKwh * formData.usablePercent) / 100
      setFormData(prev => ({ ...prev, usableKwh: Math.round(calculatedUsable * 100) / 100 }))
    }
  }, [formData.nominalKwh, formData.usablePercent])

  // Auto-generate battery_id from brand and model
  useEffect(() => {
    if (mode === 'add' && formData.brand && formData.model) {
      const id = `${formData.brand.toLowerCase().replace(/\s+/g, '-')}-${formData.model.toLowerCase().replace(/\s+/g, '-').replace(/kwh/gi, 'kwh')}`
      setFormData(prev => ({ ...prev, battery_id: id }))
    }
  }, [formData.brand, formData.model, mode])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate form
      if (!formData.battery_id || !formData.brand || !formData.model) {
        throw new Error('Battery ID, brand, and model are required')
      }

      if (formData.nominalKwh <= 0 || formData.usableKwh <= 0) {
        throw new Error('Nominal and usable capacity must be greater than 0')
      }

      if (formData.price <= 0) {
        throw new Error('Price must be greater than 0')
      }

      if (formData.roundTripEfficiency <= 0 || formData.roundTripEfficiency > 1) {
        throw new Error('Round trip efficiency must be between 0 and 1')
      }

      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save battery')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-navy-500">
            {mode === 'add' ? 'Add New Battery' : 'Edit Battery'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Battery ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Battery ID (unique identifier)
              </label>
              <input
                type="text"
                value={formData.battery_id}
                onChange={(e) => setFormData({ ...formData, battery_id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                placeholder="renon-16"
                disabled={mode === 'edit'}
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from brand and model</p>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Battery size={16} className="inline mr-2" />
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                placeholder="Renon"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                placeholder="16 kWh"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-2" />
                Price (CAD)
              </label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                min="0"
                step="0.01"
                placeholder="8000"
              />
            </div>

            {/* Nominal Capacity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <BatteryCharging size={16} className="inline mr-2" />
                Nominal Capacity (kWh)
              </label>
              <input
                type="number"
                value={formData.nominalKwh || ''}
                onChange={(e) => setFormData({ ...formData, nominalKwh: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                min="0"
                step="0.1"
                placeholder="16"
              />
            </div>

            {/* Usable Percent */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usable Percent (%)
              </label>
              <input
                type="number"
                value={formData.usablePercent || ''}
                onChange={(e) => setFormData({ ...formData, usablePercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                min="0"
                max="100"
                step="0.1"
                placeholder="90"
              />
              <p className="text-xs text-gray-500 mt-1">Usable: {formData.usableKwh.toFixed(2)} kWh</p>
            </div>

            {/* Round Trip Efficiency */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Zap size={16} className="inline mr-2" />
                Round Trip Efficiency
              </label>
              <input
                type="number"
                value={formData.roundTripEfficiency || ''}
                onChange={(e) => setFormData({ ...formData, roundTripEfficiency: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                min="0"
                max="1"
                step="0.01"
                placeholder="0.90"
              />
              <p className="text-xs text-gray-500 mt-1">{(formData.roundTripEfficiency * 100).toFixed(0)}%</p>
            </div>

            {/* Inverter Power */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Inverter Power (kW)
              </label>
              <input
                type="number"
                value={formData.inverterKw || ''}
                onChange={(e) => setFormData({ ...formData, inverterKw: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                min="0"
                step="0.1"
                placeholder="5.0"
              />
            </div>

            {/* Warranty Years */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Warranty (Years)
              </label>
              <input
                type="number"
                value={formData.warranty.years || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  warranty: { ...formData.warranty, years: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                min="0"
                placeholder="10"
              />
            </div>

            {/* Warranty Cycles */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Warranty (Cycles)
              </label>
              <input
                type="number"
                value={formData.warranty.cycles || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  warranty: { ...formData.warranty, cycles: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                required
                min="0"
                placeholder="6000"
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder || ''}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
                min="0"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-navy-500 outline-none"
              rows={3}
              placeholder="Compact and affordable solution for basic peak shaving"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Add Battery' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

