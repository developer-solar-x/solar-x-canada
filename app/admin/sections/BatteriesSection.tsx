'use client'

import { useState } from 'react'
import { Battery, BatteryCharging, Plus, Edit, Trash2, CheckCircle, XCircle, DollarSign, Zap } from 'lucide-react'
import type { BatterySpec } from '@/config/battery-specs'

interface BatteriesSectionProps {
  batteries: BatterySpec[]
  batteriesLoading: boolean
  onAddBattery: () => void
  onEditBattery: (battery: BatterySpec) => void
  onToggleBatteryStatus: (battery: BatterySpec) => void
  onDeleteBattery: (battery: BatterySpec) => void
}

export function BatteriesSection({
  batteries,
  batteriesLoading,
  onAddBattery,
  onEditBattery,
  onToggleBatteryStatus,
  onDeleteBattery,
}: BatteriesSectionProps) {
  const ITEMS_PER_PAGE = 10
  const [page, setPage] = useState(1)

  const totalBatteries = batteries.length
  const totalPages = Math.max(1, Math.ceil(totalBatteries / ITEMS_PER_PAGE))
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const currentBatteries = batteries.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy-500 mb-2">Battery Management</h1>
          <p className="text-gray-600">Manage battery specifications and pricing</p>
        </div>
        <button 
          onClick={onAddBattery}
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy-600 hover:bg-navy-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Add Battery
        </button>
      </div>

      {batteriesLoading ? (
        <div className="bg-white border-2 border-gray-100 rounded-xl shadow-lg p-8">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : totalBatteries === 0 ? (
        <div className="bg-white border-2 border-gray-100 rounded-xl p-16 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <Battery size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No batteries found</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first battery specification</p>
          <button 
            onClick={onAddBattery}
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy-600 hover:bg-navy-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add Battery
          </button>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Brand/Model</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Efficiency</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Warranty</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentBatteries.map((battery) => (
                  <tr 
                    key={battery.id} 
                    className="hover:bg-gradient-to-r hover:from-navy-50 hover:to-blue-50 transition-all group border-l-4 border-transparent hover:border-navy-400"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-navy-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:from-navy-200 group-hover:to-blue-200 transition-all">
                          <BatteryCharging size={20} className="text-navy-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-navy-700 transition-colors">
                            {battery.brand}
                          </div>
                          <div className="text-sm text-gray-600">{battery.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900">
                          {battery.nominalKwh} kWh (nominal)
                        </div>
                        <div className="text-xs text-gray-600">
                          {battery.usableKwh} kWh usable ({battery.usablePercent}%)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {(battery.roundTripEfficiency * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-green-600" />
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(battery.price)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-700">
                        <div>{battery.warranty.years} years</div>
                        <div className="text-xs text-gray-500">{battery.warranty.cycles.toLocaleString()} cycles</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {(battery as any).isActive !== false ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                          <CheckCircle size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                          <XCircle size={12} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onEditBattery(battery)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition-all border border-blue-200 hover:border-blue-300"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button 
                          onClick={() => onToggleBatteryStatus(battery)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                            (battery as any).isActive !== false
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-300'
                              : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300'
                          }`}
                          title={(battery as any).isActive !== false ? 'Set to Inactive' : 'Set to Active'}
                        >
                          {(battery as any).isActive !== false ? (
                            <>
                              <XCircle size={14} />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              Activate
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => onDeleteBattery(battery)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold transition-all border border-red-200 hover:border-red-300"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalBatteries > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            Showing{' '}
            <span className="font-bold text-navy-600">
              {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalBatteries)}
            </span>{' '}
            of <span className="font-bold text-navy-600">{totalBatteries}</span> batteries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-navy-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

