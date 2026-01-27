import { Battery, DollarSign, Lightbulb, Sun, Zap } from 'lucide-react'
import { formatProductionRange } from '@/lib/production-range'

interface HeaderSectionProps {
  title?: string
  subtitle?: string
}

export function HeaderSection({
  title = 'Battery Savings Calculator',
  subtitle = 'See how much you can save with peak-shaving battery storage',
}: HeaderSectionProps) {
  return (
    <div className="text-center mb-8">
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row mb-3 text-center">
        <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
          <Battery className="text-white" size={32} />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-navy-500">{title}</h2>
      </div>
      <p className="text-base sm:text-lg text-gray-600 flex flex-col sm:flex-row items-center justify-center gap-2">
        <Lightbulb className="text-navy-500" size={20} />
        {subtitle}
      </p>
    </div>
  )
}

interface SolarSystemCardProps {
  system?: {
    sizeKw: number
    numPanels: number
    panelWattage: number
    production: { annualKwh: number }
  }
  systemSizeKwOverride: number
  solarPanels: number
  onSolarPanelsChange: (value: number) => void
  manualMode: boolean
  manualProductionInput: string
  onManualProductionChange: (value: string) => void
  annualProductionEstimate?: number
}

export function SolarSystemCard({
  system,
  systemSizeKwOverride,
  solarPanels,
  onSolarPanelsChange,
  manualMode,
  manualProductionInput,
  onManualProductionChange,
  annualProductionEstimate,
}: SolarSystemCardProps) {
  if (!system) return null

  return (
    <div className="card p-5 bg-gradient-to-br from-green-50 to-white border-2 border-green-300 shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-green-500 rounded-lg">
          <Sun className="text-white" size={24} />
        </div>
        <h3 className="text-lg font-bold text-navy-500">Your Solar System</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-600 font-medium">System Size</p>
          <p className="text-xl font-bold text-green-600">
            {(systemSizeKwOverride || system.sizeKw).toFixed(1)} kW
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Solar Panels</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={solarPanels}
              min={0}
              onChange={(e) => onSolarPanelsChange(Math.max(0, Number(e.target.value)))}
              className="w-24 px-2 py-1 border-2 border-green-300 rounded-md text-green-700 font-bold focus:ring-2 focus:ring-green-400 focus:border-green-400"
            />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Annual Production</p>
          {manualMode ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={manualProductionInput}
                onChange={(e) => onManualProductionChange(e.target.value)}
                className="w-28 px-2 py-1 border-2 border-green-300 rounded-md text-green-700 font-bold focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
              <span className="text-sm font-semibold text-green-700">kWh</span>
            </div>
          ) : (
            <div>
              <p className="text-xl font-bold text-green-600">
                {formatProductionRange(annualProductionEstimate ?? system.production.annualKwh)}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Estimate only; actual production may vary.</p>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Solar Rebate Available</p>
          <p className="text-xl font-bold text-green-600">
            ${Math.min((systemSizeKwOverride || system.sizeKw) * 1000, 5000).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

interface MonthlyBillCardProps {
  displayedMonthlyBill: number
  annualUsageKwh: number
}

export function MonthlyBillCard({ displayedMonthlyBill, annualUsageKwh }: MonthlyBillCardProps) {
  return (
    <div className="card p-5 bg-gradient-to-br from-navy-50 to-gray-50 border-2 border-navy-200 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-navy-500 rounded-lg">
            <DollarSign className="text-white" size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Current Estimated Bill</p>
            <p className="text-2xl font-bold text-navy-500">
              ${Math.round(displayedMonthlyBill).toLocaleString()}/month
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 font-medium">Annual Usage</p>
          <p className="text-lg font-semibold text-gray-700 flex items-center gap-1">
            <Zap size={16} className="text-red-500" />
            {annualUsageKwh.toLocaleString()} kWh
          </p>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500 italic">
        This monthly estimate includes delivery, regulatory fees, and HST as well as energy usage, so it will be higher than the energy-only savings tables below.
      </div>
    </div>
  )
}

